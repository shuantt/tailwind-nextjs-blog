package common

import (
	"errors"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/artalkjs/artalk/v2/internal/entity"
	"github.com/markbates/goth"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Owner identities never merge with anonymous users based on a name or email.
type OwnerIdentity struct {
	GitHubID string `gorm:"primaryKey;size:32"`
	UserID   uint   `gorm:"uniqueIndex"`
}

func (OwnerIdentity) TableName() string { return "atk_owner_identity" }

func LocalDemo() bool { return os.Getenv("ARTALK_LOCAL_DEMO") == "1" && os.Getenv("VERCEL") == "" }

func LocalPasswordFixture() bool {
	return LocalDemo() && os.Getenv("ARTALK_GITHUB_OWNER_ID") == ""
}

func OwnerID() string {
	id := os.Getenv("ARTALK_GITHUB_OWNER_ID")
	n, err := strconv.ParseUint(id, 10, 64)
	if err != nil || n == 0 || strconv.FormatUint(n, 10) != id {
		return ""
	}
	return id
}

func IsGitHubOwner(database *gorm.DB, userID uint) bool {
	if OwnerID() == "" {
		return false
	}
	var count int64
	err := database.Model(&OwnerIdentity{}).Where("git_hub_id = ? AND user_id = ?", OwnerID(), userID).Count(&count).Error
	return err == nil && count == 1
}

func LoginGitHubOwner(database *gorm.DB, identity goth.User, siteURL string) (entity.User, error) {
	var user entity.User
	if OwnerID() == "" || identity.Provider != "github" || identity.UserID != OwnerID() {
		return user, errors.New("owner access denied")
	}
	err := database.Transaction(func(tx *gorm.DB) error {
		binding := OwnerIdentity{GitHubID: identity.UserID}
		// Serialize first-time logins on PostgreSQL, keeping the binding and user atomic.
		if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&binding).Error; err != nil {
			return err
		}
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&binding, "git_hub_id = ?", identity.UserID).Error; err != nil {
			return err
		}
		if binding.UserID != 0 {
			if err := tx.First(&user, binding.UserID).Error; err != nil {
				return err
			}
		} else {
			user = entity.User{Email: identity.Email, ReceiveEmail: identity.Email != ""}
			if err := tx.Create(&user).Error; err != nil {
				return err
			}
			if err := tx.Model(&binding).Update("user_id", user.ID).Error; err != nil {
				return err
			}
		}
		// Password login is deliberately unavailable for the GitHub owner.
		user.IsAdmin, user.Password = true, ""
		user.Name = strings.TrimSpace(identity.Name)
		if user.Name == "" {
			user.Name = strings.TrimSpace(identity.NickName)
		}
		if user.Name == "" {
			user.Name = "站主"
		}
		user.Link = strings.TrimRight(siteURL, "/") + "/about"
		user.BadgeName, user.BadgeColor = "站主", ""
		user.AvatarURL = "https://avatars.githubusercontent.com/u/" + identity.UserID
		if avatar, err := url.Parse(identity.AvatarURL); err == nil && avatar.Scheme == "https" && avatar.Host == "avatars.githubusercontent.com" && avatar.User == nil {
			user.AvatarURL = avatar.String()
		}
		return tx.Save(&user).Error
	})
	return user, err
}
