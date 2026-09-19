package main

import (
	"embed"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	_ "time/tzdata"

	"github.com/artalkjs/artalk/v2/internal/auth/gothic_fiber"
	"github.com/artalkjs/artalk/v2/internal/config"
	"github.com/artalkjs/artalk/v2/internal/core"
	"github.com/artalkjs/artalk/v2/internal/pkged"
	"github.com/artalkjs/artalk/v2/server"
	"github.com/artalkjs/artalk/v2/server/common"
	"github.com/artalkjs/artalk/v2/server/handler"
	"github.com/gofiber/fiber/v2/middleware/session"
	"golang.org/x/crypto/bcrypt"
)

//go:embed public/* i18n/* conf/*
var assets embed.FS

func validateProduction(conf *config.Config) error {
	u, err := url.Parse(conf.SiteURL)
	if err != nil || u.Scheme != "https" || u.Host == "" || u.Path != "" || u.RawQuery != "" || u.Fragment != "" || u.User != nil {
		return errors.New("ATK_SITE_URL must be an HTTPS origin without a trailing slash")
	}
	if len(os.Getenv("ATK_APP_KEY")) < 32 || conf.DB.Dsn == "" {
		return errors.New("ATK_APP_KEY (32+ characters) and ATK_DB_DSN are required")
	}
	if conf.Captcha.Turnstile.SiteKey == "" || conf.Captcha.Turnstile.SecretKey == "" {
		return errors.New("Turnstile keys are required")
	}
	if common.OwnerID() == "" || conf.Auth.Github.ClientID == "" || conf.Auth.Github.ClientSecret == "" {
		return errors.New("ARTALK_GITHUB_OWNER_ID and GitHub OAuth credentials are required")
	}
	return nil
}

func main() {
	if len(os.Args) == 2 && os.Args[1] == "--hash-password" {
		password, err := io.ReadAll(io.LimitReader(os.Stdin, 1024))
		if err != nil {
			log.Fatal("Cannot read password")
		}
		password = []byte(strings.TrimRight(string(password), "\r\n"))
		if len(password) < 12 {
			log.Fatal("Password must contain at least 12 characters")
		}
		hash, err := bcrypt.GenerateFromPassword(password, bcrypt.DefaultCost)
		if err != nil {
			log.Fatal("Cannot hash password")
		}
		fmt.Print("(bcrypt)" + string(hash))
		return
	}
	pkged.SetFS(assets)
	port := os.Getenv("PORT")
	if port == "" {
		port = "23366"
	}
	portNumber, err := strconv.Atoi(port)
	if err != nil || portNumber < 1 || portNumber > 65535 {
		log.Fatal("Invalid PORT")
	}
	demo := os.Getenv("ARTALK_LOCAL_DEMO") == "1" && os.Getenv("VERCEL") == ""
	work := filepath.Join(os.TempDir(), "shuantt-artalk-runtime")
	if demo && os.Getenv("ARTALK_DEMO_DIR") != "" {
		work = os.Getenv("ARTALK_DEMO_DIR")
	}
	if err := os.MkdirAll(work, 0700); err != nil {
		log.Fatal("Cannot create runtime directory")
	}
	defaults, err := assets.ReadFile("conf/shuantt.yml")
	if err != nil {
		log.Fatal(err)
	}
	configPath := filepath.Join(work, "artalk.yml")
	if err := os.WriteFile(configPath, defaults, 0600); err != nil {
		log.Fatal(err)
	}
	conf, err := config.NewFromFile(configPath)
	if err != nil {
		log.Fatal("Invalid Artalk configuration")
	}
	conf.Host, conf.Port = "0.0.0.0", portNumber
	conf.DB.Type = config.TypePostgreSQL
	conf.DB.TablePrefix = "atk_"
	conf.Log.Enabled, conf.Debug, conf.Cache.Enabled = false, false, false
	conf.Captcha.Enabled, conf.Captcha.Always, conf.Captcha.CaptchaType = true, true, config.TypeTurnstile
	conf.Auth.Anonymous, conf.Auth.Email.Enabled = true, false
	conf.Auth.Enabled = false // Owner OAuth is separate from visitor authentication.
	conf.AdminUsers = nil
	conf.HTTP.BodyLimit = 2
	conf.ImgUpload.Path = filepath.Join(work, "unused-images")
	if demo {
		conf.Host = "127.0.0.1"
		conf.DB.Type, conf.DB.Dsn, conf.DB.File = config.TypeSQLite, "", filepath.Join(work, "demo.db")
		conf.SiteURL = "http://localhost:3090"
		conf.Captcha.Enabled = false
		conf.Email.Enabled = false
		conf.Auth.Enabled = false
	} else if err := validateProduction(conf); err != nil {
		log.Print(err)
		http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Cache-Control", "no-store")
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusServiceUnavailable)
			_, _ = w.Write([]byte(`{"msg":"留言服務尚未啟用"}`))
		})
		log.Fatal(http.ListenAndServe(":"+port, nil))
	}
	conf.TrustedDomains = []string{conf.SiteURL}
	conf.Auth.Callback = conf.SiteURL + "/api/v2/auth/{provider}/callback"
	if os.Getenv("VERCEL") != "" {
		proxy := "X-Forwarded-For"
		conf.HTTP.ProxyHeader = &proxy
	}
	if email := os.Getenv("ARTALK_ADMIN_EMAIL"); common.LocalPasswordFixture() && email != "" {
		conf.AdminUsers = []config.AdminUserConf{{Name: "Shuan", Email: email, Password: os.Getenv("ARTALK_ADMIN_PASSWORD_HASH"), BadgeName: "站主"}}
	}
	if words := os.Getenv("ARTALK_BLOCKED_WORDS"); words != "" {
		wordFile := filepath.Join(work, "keywords.txt")
		if err := os.WriteFile(wordFile, []byte(words), 0600); err != nil {
			log.Fatal(err)
		}
		conf.Moderator.Keywords = config.KeyWordsAntispamConf{Enabled: true, Pending: true, Files: []string{wordFile}, FileSep: "\n", ReplaceTo: "＊"}
	}
	app := core.NewApp(conf)
	if err := app.Bootstrap(); err != nil {
		log.Fatal("Artalk initialization failed; check the database configuration")
	}
	if err := app.Dao().DB().AutoMigrate(&handler.StoredImage{}, &common.RuntimeState{}, &common.OwnerIdentity{}); err != nil {
		log.Fatal("Storage initialization failed")
	}
	gothic_fiber.SessionStore = session.New(session.Config{
		Storage:        &common.SQLSessionStore{DB: app.Dao().DB()},
		KeyLookup:      "cookie:" + gothic_fiber.SessionName,
		Expiration:     10 * time.Minute,
		CookieHTTPOnly: true, CookieSecure: !demo, CookieSameSite: "Lax",
	})
	if _, err := server.Serve(app); err != nil {
		log.Fatal(err)
	}
}
