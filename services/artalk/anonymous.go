package common

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/artalkjs/artalk/v2/internal/core"
	"github.com/artalkjs/artalk/v2/internal/entity"
	"github.com/gofiber/fiber/v2"
)

const browserCookie = "artalk_visitor"
const browserLifetime = 180 * 24 * time.Hour

// A name or unverified email is not proof of ownership of a visitor's messages.
func GetBrowserUser(app *core.App, c *fiber.Ctx) entity.User {
	key := c.Cookies(browserCookie)
	if len(key) != 64 {
		return entity.User{}
	}
	store := SQLSessionStore{DB: app.Dao().DB()}
	data, err := store.Get("visitor:" + key)
	if err != nil {
		return entity.User{}
	}
	id, err := strconv.ParseUint(string(data), 10, 32)
	if err != nil {
		return entity.User{}
	}
	user := app.Dao().FindUserByID(uint(id))
	if user.IsAdmin || user.Password != "" {
		return entity.User{}
	}
	return user
}

func UpdateBrowserUser(app *core.App, c *fiber.Ctx, name, email, link, ip, ua string) (entity.User, error) {
	if app.Conf().Auth.Enabled && !app.Conf().Auth.Anonymous {
		return entity.User{}, fmt.Errorf("anonymous user is not allowed")
	}
	user := GetBrowserUser(app, c)
	key := c.Cookies(browserCookie)
	if user.IsEmpty() {
		var random [32]byte
		if _, err := rand.Read(random[:]); err != nil {
			return user, err
		}
		key = hex.EncodeToString(random[:])
		var err error
		user, err = app.Dao().NewUser(name, email, link)
		if err != nil {
			return user, err
		}
	}
	user.Name, user.Email, user.Link = name, email, link
	user.LastIP, user.LastUA = ip, ua
	user.ReceiveEmail = email != ""
	if err := app.Dao().DB().Save(&user).Error; err != nil {
		return entity.User{}, err
	}
	store := SQLSessionStore{DB: app.Dao().DB()}
	if err := store.Set("visitor:"+key, []byte(strconv.FormatUint(uint64(user.ID), 10)), browserLifetime); err != nil {
		return entity.User{}, err
	}
	c.Cookie(&fiber.Cookie{Name: browserCookie, Value: key, Path: "/api/v2", HTTPOnly: true,
		Secure: strings.HasPrefix(app.Conf().SiteURL, "https://"), SameSite: "Lax", MaxAge: int(browserLifetime.Seconds())})
	return user, nil
}
