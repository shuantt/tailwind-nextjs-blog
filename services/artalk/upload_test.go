package handler

import (
	"bytes"
	"github.com/artalkjs/artalk/v2/internal/db"
	"image"
	"image/png"
	"testing"
)

func TestDurableImageValidationAndQuota(t *testing.T) {
	database, err := db.NewTestDB()
	if err != nil {
		t.Fatal(err)
	}
	defer db.CloseDB(database)
	if err := database.AutoMigrate(&StoredImage{}); err != nil {
		t.Fatal(err)
	}
	database.Exec("DELETE FROM atk_uploaded_images")
	for _, data := range [][]byte{[]byte(`<svg onload="alert(1)"/>`), bytes.Repeat([]byte("x"), imageLimit+1)} {
		if _, err := storeImage(database, data); err == nil {
			t.Fatal("invalid image accepted")
		}
	}
	var buffer bytes.Buffer
	if err := png.Encode(&buffer, image.NewRGBA(image.Rect(0, 0, 2, 2))); err != nil {
		t.Fatal(err)
	}
	stored, err := storeImage(database, buffer.Bytes())
	if err != nil {
		t.Fatal(err)
	}
	var loaded StoredImage
	if err := database.First(&loaded, "id = ?", stored.ID).Error; err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(loaded.Data, buffer.Bytes()) {
		t.Fatal("image did not survive database roundtrip")
	}
	database.Model(&loaded).Update("size", imageStorageLimit)
	if _, err := storeImage(database, buffer.Bytes()); err == nil {
		t.Fatal("storage quota bypassed")
	}
}
