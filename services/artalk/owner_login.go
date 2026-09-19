package handler

import (
	"bytes"
	"html/template"
	"strings"
	"time"

	"github.com/artalkjs/artalk/v2/internal/auth/gothic_fiber"
	"github.com/artalkjs/artalk/v2/internal/core"
	"github.com/artalkjs/artalk/v2/internal/dao"
	"github.com/artalkjs/artalk/v2/server/common"
	"github.com/gofiber/fiber/v2"
	"github.com/markbates/goth"
	"github.com/markbates/goth/providers/github"
)

var ownerPage = template.Must(template.New("owner").Parse(`<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>管理登入 | SHUANTT</title>
<style>:root{color-scheme:light dark}*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;font:16px/1.7 system-ui,sans-serif;background:light-dark(#fafafa,#171717);color:light-dark(#202020,#eee)}main{width:100%;max-width:380px}small{letter-spacing:.3em}h1{font-size:26px;margin:20px 0 8px}p{color:light-dark(#666,#aaa);margin:0 0 24px}.button,button{display:block;width:100%;padding:12px 16px;border:1px solid light-dark(#ccc,#555);border-radius:8px;background:light-dark(#202020,#eee);color:light-dark(#fff,#171717);text-align:center;text-decoration:none;font:inherit}.button:focus-visible{outline:3px solid currentColor;outline-offset:4px}button:disabled{opacity:.5}aside{margin-top:16px;font-size:14px;color:light-dark(#666,#aaa)}</style></head>
<body><script>try { const theme = localStorage.getItem('theme'); if (theme === 'dark' || theme === 'light') document.documentElement.style.colorScheme = theme; } catch (_) {}</script><main><small>SHUANTT</small><h1>管理登入</h1><p>僅限站主的 GitHub 帳號。</p>{{if .Ready}}<a class="button" href="/api/v2/auth/github">使用 GitHub 登入</a>{{else}}<button disabled>使用 GitHub 登入</button><aside>尚未設定 GitHub 授權，設定完成後即可登入。</aside>{{end}}{{if .Denied}}<aside role="alert">無法登入。請確認使用站主帳號，並重新開始授權。</aside>{{end}}</main></body></html>`))

// html/template escapes the user data as JavaScript, including closing script tags.
var ownerCallback = template.Must(template.New("callback").Parse(`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>登入中</title></head><body><p>登入成功，正在開啟管理中心……</p><script>try { localStorage.setItem('ArtalkUser', JSON.stringify({{.User}})); location.replace({{.Destination}}); } catch (_) { document.querySelector('p').textContent = '請允許此網站儲存登入資訊，再重新登入。'; }</script></body></html>`))

func ownerDestination(value string) string {
	if value == "guestbook" {
		return "/guestbook/admin"
	}
	return "/sidebar/#/comments"
}

func ownerReady(app *core.App) bool {
	return common.OwnerID() != "" && app.Conf().Auth.Github.ClientID != "" && app.Conf().Auth.Github.ClientSecret != ""
}

func AuthSocialLogin(app *core.App, router fiber.Router) {
	if ownerReady(app) {
		cfg := app.Conf().Auth.Github
		goth.UseProviders(github.New(cfg.ClientID, cfg.ClientSecret, app.Conf().SiteURL+"/api/v2/auth/github/callback", "read:user", "user:email"))
	}
	router.Use("/owner", func(c *fiber.Ctx) error {
		c.Set("Cache-Control", "no-store")
		c.Set("X-Robots-Tag", "noindex, nofollow")
		return c.Next()
	})
	router.Get("/owner/login", func(c *fiber.Ctx) error {
		if c.Query("error") == "" {
			target := ""
			if c.Query("next") == "guestbook" {
				target = "guestbook"
			}
			c.Cookie(&fiber.Cookie{Name: "owner-destination", Value: target, Path: "/api/v2", HTTPOnly: true, Secure: strings.HasPrefix(app.Conf().SiteURL, "https://"), SameSite: "Lax", Expires: time.Now().Add(10 * time.Minute)})
		}
		var out bytes.Buffer
		if err := ownerPage.Execute(&out, struct{ Ready, Denied bool }{ownerReady(app), c.Query("error") != ""}); err != nil {
			return err
		}
		return c.Type("html").Send(out.Bytes())
	})
	// Validate the signed token AND the current immutable GitHub owner binding.
	// Guestbook calls this endpoint server-to-server; profile fields confer no access.
	router.Get("/owner/session", func(c *fiber.Ctx) error {
		if !strings.HasPrefix(c.Get("Authorization"), "Bearer ") || c.Query("token") != "" {
			return c.SendStatus(fiber.StatusUnauthorized)
		}
		user, err := common.GetUserByReq(app, c)
		if err != nil || !user.IsAdmin || !common.IsGitHubOwner(app.Dao().DB(), user.ID) {
			return c.SendStatus(fiber.StatusUnauthorized)
		}
		return c.JSON(fiber.Map{"is_owner": true})
	})
	router.Get("/owner/entry.js", func(c *fiber.Ctx) error {
		return c.Type("js").SendString(`(() => {
  const check = () => {
    let token = '';
    try { token = JSON.parse(localStorage.getItem('ArtalkUser') || '{}')?.token || ''; } catch (_) {}
    if (!token || location.hash.startsWith('#/login')) location.replace('/api/v2/owner/login');
  };
  addEventListener('hashchange', check);
  addEventListener('focus', check);
  addEventListener('storage', (event) => { if (!event.key || event.key === 'ArtalkUser') check(); });
  check();
})();`)
	})
	// Visitors remain anonymous; no social login panel is advertised by Artalk.
	router.Get("/conf/auth/providers", func(c *fiber.Ctx) error {
		return common.RespData(c, fiber.Map{"providers": []interface{}{}, "anonymous": true})
	})
	router.Use("/auth/:provider", func(c *fiber.Ctx) error {
		c.Set("Cache-Control", "no-store")
		c.Set("Referrer-Policy", "no-referrer")
		if c.Params("provider") != "github" || !ownerReady(app) {
			return c.SendStatus(fiber.StatusNotFound)
		}
		c.Request().URI().QueryArgs().Del("provider")
		return c.Next()
	})
	router.Get("/auth/:provider", func(c *fiber.Ctx) error {
		c.Request().URI().QueryArgs().Del("state") // Always generate state on the server.
		return gothic_fiber.BeginAuthHandler(c)
	})
	router.Get("/auth/:provider/callback", func(c *fiber.Ctx) error {
		identity, err := gothic_fiber.CompleteUserAuth(c)
		if err != nil {
			return c.Redirect("/api/v2/owner/login?error=denied", fiber.StatusSeeOther)
		}
		user, err := common.LoginGitHubOwner(app.Dao().DB(), identity, app.Conf().SiteURL)
		if err != nil {
			return c.Redirect("/api/v2/owner/login?error=denied", fiber.StatusSeeOther)
		}
		app.Dao().CacheAction(func(cache *dao.DaoCache) { cache.UserCacheSave(&user) })
		token, err := common.LoginGetUserToken(user, app.Conf().AppKey, app.Conf().LoginTimeout)
		if err != nil {
			return c.SendStatus(fiber.StatusInternalServerError)
		}
		var out bytes.Buffer
		data := fiber.Map{"name": user.Name, "email": user.Email, "link": user.Link, "token": token, "is_admin": true}
		destination := ownerDestination(c.Cookies("owner-destination"))
		c.Cookie(&fiber.Cookie{Name: "owner-destination", Value: "", Path: "/api/v2", HTTPOnly: true, Secure: strings.HasPrefix(app.Conf().SiteURL, "https://"), SameSite: "Lax", Expires: time.Unix(1, 0), MaxAge: -1})
		if err := ownerCallback.Execute(&out, fiber.Map{"User": data, "Destination": destination}); err != nil {
			return err
		}
		return c.Type("html").Send(out.Bytes())
	})
}

func OwnerPasswordLogin(app *core.App, router fiber.Router) {
	// An isolated local smoke fixture only; never enabled on Vercel.
	if common.LocalPasswordFixture() {
		UserLogin(app, router)
	}
}
