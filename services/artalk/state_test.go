package common

import (
	"encoding/json"
	"github.com/artalkjs/artalk/v2/internal/config"
	"github.com/artalkjs/artalk/v2/internal/core"
	"github.com/artalkjs/artalk/v2/internal/dao"
	"github.com/artalkjs/artalk/v2/internal/db"
	"github.com/gofiber/fiber/v2"
	"net/http/httptest"
	"testing"
	"time"
)

func TestCaptchaProofIsBrowserBoundAndSingleUseAcrossInstances(t *testing.T) {
	database, err := db.NewTestDB()
	if err != nil {
		t.Fatal(err)
	}
	defer db.CloseDB(database)
	if err := database.AutoMigrate(&RuntimeState{}); err != nil {
		t.Fatal(err)
	}
	newInstance := func() *fiber.App {
		app := core.NewApp(&config.Config{SiteURL: "https://example.test"})
		app.SetDao(dao.NewDao(database))
		f := fiber.New()
		f.Get("/mint", func(c *fiber.Ctx) error { return MintCaptchaProof(app, c) })
		f.Get("/status", func(c *fiber.Ctx) error { return c.JSON(HasCaptchaProof(app, c)) })
		f.Post("/consume", func(c *fiber.Ctx) error { return c.JSON(ConsumeCaptchaProof(app, c)) })
		return f
	}
	a, b := newInstance(), newInstance()
	response, err := a.Test(httptest.NewRequest("GET", "/mint", nil))
	if err != nil {
		t.Fatal(err)
	}
	cookies := response.Cookies()
	response.Body.Close()
	if len(cookies) != 1 || !cookies[0].Secure || !cookies[0].HttpOnly {
		t.Fatal("proof cookie lacks security attributes")
	}
	check := func(method, route string, withCookie, expected bool) {
		t.Helper()
		r := httptest.NewRequest(method, route, nil)
		if withCookie {
			r.AddCookie(cookies[0])
		}
		res, err := b.Test(r)
		if err != nil {
			t.Fatal(err)
		}
		defer res.Body.Close()
		var pass bool
		if err := json.NewDecoder(res.Body).Decode(&pass); err != nil {
			t.Fatal(err)
		}
		if pass != expected {
			t.Fatalf("%s %s: got %v", method, route, pass)
		}
	}
	check("GET", "/status", false, false)
	check("GET", "/status", true, true)
	check("POST", "/consume", true, true)
	check("POST", "/consume", true, false)
	check("GET", "/status", true, false)
}

func TestSessionsSurviveAnotherInstanceAndExpire(t *testing.T) {
	database, err := db.NewTestDB()
	if err != nil {
		t.Fatal(err)
	}
	defer db.CloseDB(database)
	if err := database.AutoMigrate(&RuntimeState{}); err != nil {
		t.Fatal(err)
	}
	a, b := SQLSessionStore{DB: database}, SQLSessionStore{DB: database}
	if err := a.Set("session-a", []byte("value"), time.Minute); err != nil {
		t.Fatal(err)
	}
	value, err := b.Get("session-a")
	if err != nil || string(value) != "value" {
		t.Fatal("another instance cannot read session")
	}
	database.Model(&RuntimeState{}).Where("key = ?", stateKey("session-a")).Update("expires_at", time.Now().Add(-time.Minute))
	value, err = b.Get("session-a")
	if err != nil || value != nil {
		t.Fatal("expired session was accepted")
	}
}
