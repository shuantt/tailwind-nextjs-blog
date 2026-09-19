// Adapted from Artalk v2.10.0 (MIT). Uploads use the comment database so they survive cold starts.
package handler

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"time"

	"github.com/artalkjs/artalk/v2/internal/core"
	"github.com/artalkjs/artalk/v2/server/common"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

const imageLimit = 1024 * 1024
const imageStorageLimit = 50 * 1024 * 1024

type StoredImage struct {
	ID          string `gorm:"primaryKey;size:32"`
	ContentType string
	Data        []byte
	Size        int64
	CreatedAt   time.Time
}

func (StoredImage) TableName() string { return "atk_uploaded_images" }

func storeImage(db *gorm.DB, data []byte) (StoredImage, error) {
	if len(data) == 0 || len(data) > imageLimit {
		return StoredImage{}, errors.New("圖片上限為 1 MB")
	}
	dimensions, format, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil || (format != "jpeg" && format != "png" && format != "gif") || dimensions.Width <= 0 || dimensions.Height <= 0 || int64(dimensions.Width)*int64(dimensions.Height) > 20000000 {
		return StoredImage{}, errors.New("請使用有效的 JPG、PNG 或 GIF 圖片（上限 2,000 萬像素）")
	}
	id := make([]byte, 16)
	if _, err := rand.Read(id); err != nil {
		return StoredImage{}, errors.New("圖片儲存失敗")
	}
	stored := StoredImage{ID: hex.EncodeToString(id), ContentType: http.DetectContentType(data), Data: data, Size: int64(len(data))}
	err = db.Transaction(func(tx *gorm.DB) error {
		// Serialize quota checks across instances on PostgreSQL.
		if tx.Dialector.Name() == "postgres" {
			if err := tx.Exec("SELECT pg_advisory_xact_lock(?)", 73918264).Error; err != nil {
				return err
			}
		}
		var used int64
		if err := tx.Model(&StoredImage{}).Select("COALESCE(SUM(size), 0)").Scan(&used).Error; err != nil {
			return err
		}
		if used+stored.Size > imageStorageLimit {
			return errors.New("圖片空間已滿，請先使用文字留言")
		}
		return tx.Create(&stored).Error
	})
	return stored, err
}

func Upload(app *core.App, router fiber.Router) {
	router.Post("/upload", common.LimiterGuard(app, func(c *fiber.Ctx) error {
		if !app.Conf().ImgUpload.Enabled {
			return common.RespError(c, 403, "圖片上傳已停用")
		}
		file, err := c.FormFile("file")
		if err != nil || file.Size > imageLimit {
			return common.RespError(c, 400, "請選擇 1 MB 以內的圖片")
		}
		src, err := file.Open()
		if err != nil {
			return common.RespError(c, 400, "無法讀取圖片")
		}
		defer src.Close()
		data, err := io.ReadAll(io.LimitReader(src, imageLimit+1))
		if err != nil {
			return common.RespError(c, 400, "無法讀取圖片")
		}
		stored, err := storeImage(app.Dao().DB(), data)
		if err != nil {
			return common.RespError(c, 400, "無法儲存圖片，請確認格式、大小或稍後再試")
		}
		return common.RespData(c, common.Map{
			"file_type": "image", "file_name": stored.ID,
			"public_url": app.Conf().SiteURL + "/comment-images/" + stored.ID,
		})
	}))
}

func UploadedImages(app *core.App, router fiber.Router) {
	router.Get("/comment-images/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		if len(id) != 32 {
			return c.SendStatus(404)
		}
		if _, err := hex.DecodeString(id); err != nil {
			return c.SendStatus(404)
		}
		var stored StoredImage
		if err := app.Dao().DB().First(&stored, "id = ?", id).Error; err != nil {
			return c.SendStatus(404)
		}
		c.Set("Content-Type", stored.ContentType)
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("Content-Security-Policy", "default-src 'none'; sandbox")
		c.Set("Cache-Control", "public, max-age=300")
		return c.Send(stored.Data)
	})
	// Deletion uses the same administrator identity as Artalk's comment management.
	router.Delete("/api/v2/images/:id", func(c *fiber.Ctx) error {
		if !common.CheckIsAdminReq(app, c) {
			return c.SendStatus(403)
		}
		if err := app.Dao().DB().Delete(&StoredImage{}, "id = ?", c.Params("id")).Error; err != nil {
			return c.SendStatus(500)
		}
		return c.SendStatus(204)
	})
}
