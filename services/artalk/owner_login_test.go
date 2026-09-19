package handler

import (
	"bytes"
	"io"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/artalkjs/artalk/v2/internal/auth/gothic_fiber"
	"github.com/artalkjs/artalk/v2/internal/config"
	"github.com/artalkjs/artalk/v2/internal/core"
	"github.com/artalkjs/artalk/v2/server/common"
	artalktest "github.com/artalkjs/artalk/v2/test"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/session"
	"github.com/markbates/goth"
)

func TestOwnerRoutesFailClosedAndUseServerState(t *testing.T) {
	t.Setenv("ARTALK_GITHUB_OWNER_ID", "12345")
	t.Setenv("ARTALK_LOCAL_DEMO", "")
	conf := &config.Config{SiteURL: "https://example.test"}
	app := core.NewApp(conf)
	web := fiber.New()
	AuthSocialLogin(app, web.Group("/api/v2"))
	OwnerPasswordLogin(app, web.Group("/api/v2"))
	res, err := web.Test(httptest.NewRequest("GET", "/api/v2/owner/login", nil))
	if err != nil {
		t.Fatal(err)
	}
	body, _ := io.ReadAll(res.Body)
	res.Body.Close()
	if !bytes.Contains(body, []byte("button disabled")) || bytes.Contains(body, []byte("type=\"password\"")) {
		t.Fatal("incorrect unconfigured login UI")
	}
	res, err = web.Test(httptest.NewRequest("POST", "/api/v2/user/access_token", nil))
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if res.StatusCode != 404 {
		t.Fatal("password login available")
	}
	conf.Auth.Github.ClientID, conf.Auth.Github.ClientSecret = "test", "test"
	web = fiber.New()
	AuthSocialLogin(app, web.Group("/api/v2"))
	oldStore := gothic_fiber.SessionStore
	gothic_fiber.SessionStore = session.New()
	defer func() { gothic_fiber.SessionStore = oldStore }()
	res, err = web.Test(httptest.NewRequest("GET", "/api/v2/auth/google", nil))
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if res.StatusCode != 404 {
		t.Fatal("another provider enabled")
	}
	res, err = web.Test(httptest.NewRequest("GET", "/api/v2/auth/github?state=attacker&provider=google", nil))
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	location, err := url.Parse(res.Header.Get("Location"))
	if err != nil || location.Host != "github.com" || location.Query().Get("state") == "" || location.Query().Get("state") == "attacker" {
		t.Fatal("unsafe authorization redirect", location, err)
	}
	request := httptest.NewRequest("GET", "/api/v2/auth/github/callback?state=wrong&code=fake", nil)
	for _, cookie := range res.Cookies() {
		request.AddCookie(cookie)
	}
	res, err = web.Test(request)
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if res.StatusCode != 303 || !strings.Contains(res.Header.Get("Location"), "error=denied") {
		t.Fatal("invalid state accepted")
	}
}

func TestOwnerCallbackEscapesUntrustedProfile(t *testing.T) {
	var out bytes.Buffer
	if err := ownerCallback.Execute(&out, fiber.Map{"User": fiber.Map{"name": "</script><script>alert(1)</script>", "token": "test"}, "Destination": ownerDestination("guestbook")}); err != nil {
		t.Fatal(err)
	}
	if strings.Contains(out.String(), "<script>alert(1)") {
		t.Fatal("profile HTML injection")
	}
	if !strings.Contains(out.String(), "/guestbook/admin") {
		t.Fatal("missing return destination")
	}
	for _, target := range []string{"https://evil.example", "//evil.example", "/guestbook/admin", ""} {
		if ownerDestination(target) != "/sidebar/#/comments" {
			t.Fatal("unsafe return destination")
		}
	}
}

func TestSharedOwnerSessionRequiresSignedCurrentGitHubBinding(t *testing.T) {
	t.Setenv("ARTALK_LOCAL_DEMO", "")
	t.Setenv("ARTALK_GITHUB_OWNER_ID", "12345")
	app, err := artalktest.NewTestApp()
	if err != nil {
		t.Fatal(err)
	}
	defer app.Cleanup()
	if err := app.Dao().DB().AutoMigrate(&common.OwnerIdentity{}); err != nil {
		t.Fatal(err)
	}
	owner, err := common.LoginGitHubOwner(app.Dao().DB(), goth.User{Provider: "github", UserID: "12345"}, "https://example.test")
	if err != nil {
		t.Fatal(err)
	}
	token, err := common.LoginGetUserToken(owner, app.Conf().AppKey, 300)
	if err != nil {
		t.Fatal(err)
	}
	expired, err := common.LoginGetUserToken(owner, app.Conf().AppKey, -1)
	if err != nil {
		t.Fatal(err)
	}
	legacy := app.Dao().FindUser("admin", "admin@qwqaq.com")
	legacyToken, err := common.LoginGetUserToken(legacy, app.Conf().AppKey, 300)
	if err != nil {
		t.Fatal(err)
	}
	web := fiber.New()
	AuthSocialLogin(app.App, web.Group("/api/v2"))
	check := func(credential string, status int) {
		t.Helper()
		req := httptest.NewRequest("GET", "/api/v2/owner/session", nil)
		if credential != "" {
			req.Header.Set("Authorization", "Bearer "+credential)
		}
		res, err := web.Test(req)
		if err != nil {
			t.Fatal(err)
		}
		defer res.Body.Close()
		if res.StatusCode != status {
			t.Fatalf("expected %d got %d", status, res.StatusCode)
		}
		if res.Header.Get("Cache-Control") != "no-store" {
			t.Fatal("session must not be cached")
		}
	}
	check("", 401)
	check("forged.payload.signature", 401)
	check(expired, 401)
	check(legacyToken, 401)
	check(token, 200)
	t.Setenv("ARTALK_GITHUB_OWNER_ID", "67890")
	check(token, 401)
}
