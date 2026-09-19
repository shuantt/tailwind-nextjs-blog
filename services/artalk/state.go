package common

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"github.com/artalkjs/artalk/v2/internal/core"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type RuntimeState struct {
	Key       string `gorm:"primaryKey;size:80"`
	Data      []byte
	ExpiresAt time.Time `gorm:"index"`
}

func (RuntimeState) TableName() string { return "atk_runtime_state" }

type SQLSessionStore struct{ DB *gorm.DB }

func stateKey(key string) string {
	sum := sha256.Sum256([]byte(key))
	return hex.EncodeToString(sum[:])
}

func (s *SQLSessionStore) Get(key string) ([]byte, error) {
	var row RuntimeState
	err := s.DB.First(&row, "key = ? AND expires_at > ?", stateKey(key), time.Now()).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return row.Data, err
}
func (s *SQLSessionStore) Set(key string, data []byte, expiration time.Duration) error {
	if expiration <= 0 {
		expiration = 10 * time.Minute
	}
	if err := s.DB.Where("expires_at <= ?", time.Now()).Delete(&RuntimeState{}).Error; err != nil {
		return err
	}
	return s.DB.Clauses(clause.OnConflict{UpdateAll: true}).Create(&RuntimeState{Key: stateKey(key), Data: data, ExpiresAt: time.Now().Add(expiration)}).Error
}
func (s *SQLSessionStore) Delete(key string) error {
	return s.DB.Delete(&RuntimeState{}, "key = ?", stateKey(key)).Error
}
func (s *SQLSessionStore) Reset() error { return errors.New("global session reset is disabled") }
func (s *SQLSessionStore) Close() error { return nil }

func MintCaptchaProof(app *core.App, c *fiber.Ctx) error {
	var random [32]byte
	if _, err := rand.Read(random[:]); err != nil {
		return c.SendStatus(503)
	}
	value := hex.EncodeToString(random[:])
	store := SQLSessionStore{DB: app.Dao().DB()}
	if err := store.Set("captcha:"+value, []byte("verified"), 5*time.Minute); err != nil {
		return c.SendStatus(503)
	}
	c.Cookie(&fiber.Cookie{Name: "artalk_verification", Value: value, Path: "/api/v2", HTTPOnly: true, Secure: strings.HasPrefix(app.Conf().SiteURL, "https://"), SameSite: "Lax", MaxAge: 300})
	return nil
}

func ConsumeCaptchaProof(app *core.App, c *fiber.Ctx) bool {
	value := c.Cookies("artalk_verification")
	if len(value) != 64 {
		return false
	}
	// A single DELETE consumes the proof atomically, including across different instances.
	result := app.Dao().DB().Where("key = ? AND expires_at > ?", stateKey("captcha:"+value), time.Now()).Delete(&RuntimeState{})
	return result.Error == nil && result.RowsAffected == 1
}

func HasCaptchaProof(app *core.App, c *fiber.Ctx) bool {
	value := c.Cookies("artalk_verification")
	if len(value) != 64 {
		return false
	}
	store := SQLSessionStore{DB: app.Dao().DB()}
	data, err := store.Get("captcha:" + value)
	return err == nil && len(data) > 0
}
