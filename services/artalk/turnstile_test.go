package captcha

import (
	"io"
	"net/http"
	"strings"
	"testing"
)

type fakeVerificationTransport func(*http.Request) (*http.Response, error)

func (f fakeVerificationTransport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestTurnstileChecksHostnameActionAndServiceErrors(t *testing.T) {
	t.Setenv("ATK_SITE_URL", "https://example.test")
	transport := http.DefaultTransport
	t.Cleanup(func() { http.DefaultTransport = transport })
	checker := TurnstileChecker{User: &User{}, SiteKey: "test", SecreteKey: "test"}
	for _, tc := range []struct {
		body    string
		status  int
		allowed bool
	}{
		{`{"success":true,"hostname":"example.test","action":"artalk"}`, 200, true},
		{`{"success":true,"hostname":"attacker.test","action":"artalk"}`, 200, false},
		{`{"success":true,"hostname":"example.test","action":"guestbook"}`, 200, false},
		{`{"success":false}`, 200, false},
		{`unavailable`, 503, false},
	} {
		http.DefaultTransport = fakeVerificationTransport(func(r *http.Request) (*http.Response, error) {
			return &http.Response{StatusCode: tc.status, Body: io.NopCloser(strings.NewReader(tc.body)), Header: make(http.Header)}, nil
		})
		allowed, err := checker.Check("test-token")
		if allowed != tc.allowed {
			t.Fatalf("unexpected verification result: %s", tc.body)
		}
		if !allowed && err == nil {
			t.Fatal("failed verification must include an error")
		}
	}
}
