package main

import (
	"github.com/artalkjs/artalk/v2/internal/config"
	"testing"
)

func TestProductionRequiresPersistentDatabaseAndCaptcha(t *testing.T) {
	t.Setenv("ATK_APP_KEY", "test-only-32-character-key-123456789")
	t.Setenv("ARTALK_GITHUB_OWNER_ID", "12345")
	c := &config.Config{SiteURL: "https://example.test", DB: config.DBConf{Dsn: "postgres://test"}}
	c.Auth.Github.ClientID = "test"
	c.Auth.Github.ClientSecret = "test"
	if validateProduction(c) == nil {
		t.Fatal("missing captcha must fail closed")
	}
	c.Captcha.Turnstile.SiteKey = "test"
	c.Captcha.Turnstile.SecretKey = "test"
	if err := validateProduction(c); err != nil {
		t.Fatal(err)
	}
	t.Setenv("ARTALK_GITHUB_OWNER_ID", "")
	if validateProduction(c) == nil {
		t.Fatal("missing owner allowlist accepted")
	}
	t.Setenv("ARTALK_GITHUB_OWNER_ID", "12345")
	c.SiteURL = "https://example.test/path"
	if validateProduction(c) == nil {
		t.Fatal("non-origin URL accepted")
	}
	c.SiteURL = "https://example.test"
	c.DB.Dsn = ""
	if validateProduction(c) == nil {
		t.Fatal("ephemeral database accepted")
	}
}
