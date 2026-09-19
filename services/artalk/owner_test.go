package common

import (
	"net/http/httptest"
	"testing"

	"github.com/artalkjs/artalk/v2/internal/db"
	"github.com/artalkjs/artalk/v2/internal/entity"
	"github.com/artalkjs/artalk/v2/test"
	"github.com/gofiber/fiber/v2"
	"github.com/markbates/goth"
)

func TestAdminTokenRequiresCurrentOwnerBinding(t *testing.T) {
	t.Setenv("ARTALK_LOCAL_DEMO", "")
	t.Setenv("ARTALK_GITHUB_OWNER_ID", "12345")
	app, err := test.NewTestApp()
	if err != nil {
		t.Fatal(err)
	}
	defer app.Cleanup()
	if err := app.Dao().DB().AutoMigrate(&OwnerIdentity{}); err != nil {
		t.Fatal(err)
	}
	legacy := app.Dao().FindUser("admin", "admin@qwqaq.com")
	if !legacy.IsAdmin {
		t.Fatal("missing admin fixture")
	}
	owner, err := LoginGitHubOwner(app.Dao().DB(), goth.User{Provider: "github", UserID: "12345"}, "https://blog.example.test")
	if err != nil {
		t.Fatal(err)
	}
	web := fiber.New()
	web.Get("/protected", func(c *fiber.Ctx) error {
		_, err := GetUserByReq(app.App, c)
		if err != nil {
			return c.SendStatus(403)
		}
		return c.SendStatus(200)
	})
	check := func(user entity.User, status int) {
		t.Helper()
		token, err := LoginGetUserToken(user, app.Conf().AppKey, 300)
		if err != nil {
			t.Fatal(err)
		}
		req := httptest.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		res, err := web.Test(req)
		if err != nil {
			t.Fatal(err)
		}
		res.Body.Close()
		if res.StatusCode != status {
			t.Fatalf("expected %d, got %d", status, res.StatusCode)
		}
	}
	check(legacy, 403)
	check(owner, 200)
	t.Setenv("ARTALK_LOCAL_DEMO", "1")
	t.Setenv("VERCEL", "")
	check(legacy, 403)
	check(owner, 200)
	t.Setenv("ARTALK_GITHUB_OWNER_ID", "67890")
	check(owner, 403)
}

func TestOwnerIdentityIsNotAnEmailOrNameMatch(t *testing.T) {
	t.Setenv("ARTALK_GITHUB_OWNER_ID", "12345")
	database, err := db.NewTestDB()
	if err != nil {
		t.Fatal(err)
	}
	defer db.CloseDB(database)
	if err := database.AutoMigrate(&entity.User{}, &OwnerIdentity{}); err != nil {
		t.Fatal(err)
	}
	visitor := entity.User{Name: "Shuan", Email: "owner@example.test"}
	if err := database.Create(&visitor).Error; err != nil {
		t.Fatal(err)
	}
	for _, identity := range []goth.User{
		{Provider: "github", UserID: "999", Email: visitor.Email, Name: visitor.Name},
		{Provider: "google", UserID: "12345"},
		{Provider: "github"},
	} {
		if _, err := LoginGitHubOwner(database, identity, "https://blog.example.test"); err == nil {
			t.Fatal("unauthorized identity accepted")
		}
	}
	identity := goth.User{Provider: "github", UserID: "12345", Email: visitor.Email, Name: visitor.Name}
	owner, err := LoginGitHubOwner(database, identity, "https://blog.example.test")
	if err != nil {
		t.Fatal(err)
	}
	if owner.ID == visitor.ID || !owner.IsAdmin || owner.Password != "" {
		t.Fatal("owner merged with visitor or has password")
	}
	if !IsGitHubOwner(database, owner.ID) || IsGitHubOwner(database, visitor.ID) {
		t.Fatal("incorrect authorization")
	}
	if err := database.First(&visitor, visitor.ID).Error; err != nil || visitor.IsAdmin {
		t.Fatal("visitor was promoted")
	}
	identity.Email, identity.Name = "changed@example.test", "renamed"
	identity.AvatarURL = "https://avatars.githubusercontent.com/u/12345?v=4"
	again, err := LoginGitHubOwner(database, identity, "https://blog.example.test/")
	if err != nil || again.ID != owner.ID {
		t.Fatal("identity changed with email/name", err)
	}
	if again.Name != "renamed" || again.AvatarURL != identity.AvatarURL || again.Link != "https://blog.example.test/about" || again.BadgeName != "站主" {
		t.Fatal("GitHub public profile was not synchronized")
	}
	if visitor.AvatarURL != "" || visitor.BadgeName != "" {
		t.Fatal("visitor received the owner profile")
	}
	identity.Name, identity.NickName, identity.AvatarURL = " ", "github-handle", "https://untrusted.example/avatar.svg"
	fallback, err := LoginGitHubOwner(database, identity, "https://blog.example.test")
	if err != nil || fallback.Name != "github-handle" || fallback.AvatarURL != "https://avatars.githubusercontent.com/u/12345" {
		t.Fatal("invalid GitHub profile fallback", err)
	}
	t.Setenv("ARTALK_GITHUB_OWNER_ID", "67890")
	if IsGitHubOwner(database, owner.ID) {
		t.Fatal("previous owner remains authorized")
	}
	t.Setenv("ARTALK_GITHUB_OWNER_ID", "")
	if _, err := LoginGitHubOwner(database, identity, "https://blog.example.test"); err == nil {
		t.Fatal("missing allowlist accepted")
	}
}

func TestOwnerIDIsCanonicalAndDemoCannotRunOnVercel(t *testing.T) {
	for _, id := range []string{"", "shuantt", "0", "001", "-1", " 123"} {
		t.Setenv("ARTALK_GITHUB_OWNER_ID", id)
		if OwnerID() != "" {
			t.Fatal("invalid owner ID accepted", id)
		}
	}
	t.Setenv("ARTALK_LOCAL_DEMO", "1")
	t.Setenv("VERCEL", "1")
	if LocalDemo() {
		t.Fatal("demo bypass on Vercel")
	}
	t.Setenv("VERCEL", "")
	t.Setenv("ARTALK_GITHUB_OWNER_ID", "12345")
	if LocalPasswordFixture() {
		t.Fatal("password fixture enabled with real OAuth")
	}
	t.Setenv("ARTALK_GITHUB_OWNER_ID", "invalid")
	if LocalPasswordFixture() {
		t.Fatal("invalid owner setting enabled password fixture")
	}
	t.Setenv("ARTALK_GITHUB_OWNER_ID", "")
	if !LocalPasswordFixture() {
		t.Fatal("isolated smoke fixture unavailable")
	}
}
