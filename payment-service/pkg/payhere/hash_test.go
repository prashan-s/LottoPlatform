package payhere

import (
	"strings"
	"testing"
)

func TestFormatAmountAlwaysUsesTwoDecimals(t *testing.T) {
	if got := FormatAmount(100); got != "100.00" {
		t.Fatalf("expected 100.00, got %s", got)
	}
}

func TestFormatAmountRoundsHalfUpAtTwoDecimals(t *testing.T) {
	if got := FormatAmount(100.125); got != "100.12" {
		t.Fatalf("expected 100.12, got %s", got)
	}
}

func TestFormatAmountHandlesNegativeValues(t *testing.T) {
	if got := FormatAmount(-25.5); got != "-25.50" {
		t.Fatalf("expected -25.50, got %s", got)
	}
}

func TestComputeHashMatchesKnownVector(t *testing.T) {
	got := ComputeHash("1222359", "order_12345", "1000.00", "LKR", "secret")
	const want = "A61CD349D08BA9DC2E9CFBBB0429273C"

	if got != want {
		t.Fatalf("expected %s, got %s", want, got)
	}
}

func TestComputeHashIsDeterministic(t *testing.T) {
	a := ComputeHash("1222359", "order_10", "500.00", "LKR", "secret")
	b := ComputeHash("1222359", "order_10", "500.00", "LKR", "secret")

	if a != b {
		t.Fatalf("expected deterministic hash, got %s and %s", a, b)
	}
}

func TestComputeHashChangesWhenOrderIdChanges(t *testing.T) {
	a := ComputeHash("1222359", "order_A", "500.00", "LKR", "secret")
	b := ComputeHash("1222359", "order_B", "500.00", "LKR", "secret")

	if a == b {
		t.Fatalf("expected different hashes for different order ids, got %s", a)
	}
}

func TestVerifyNotifyReturnsTrueForMatchingSignature(t *testing.T) {
	secretHash := upperMD5("secret")
	sig := upperMD5("1222359" + "order_1" + "250.00" + "LKR" + "2" + secretHash)
	ok := VerifyNotify("1222359", "order_1", "250.00", "LKR", "2", "secret", sig)

	if !ok {
		t.Fatal("expected verification to pass")
	}
}

func TestVerifyNotifyIgnoresReceivedSignatureCase(t *testing.T) {
	secretHash := upperMD5("secret")
	sig := upperMD5("1222359" + "order_1" + "250.00" + "LKR" + "2" + secretHash)
	ok := VerifyNotify("1222359", "order_1", "250.00", "LKR", "2", "secret", strings.ToLower(sig))

	if !ok {
		t.Fatal("expected verification to pass for mixed-case signature")
	}
}

func TestVerifyNotifyReturnsFalseForMismatchedSignature(t *testing.T) {
	ok := VerifyNotify("1222359", "order_1", "250.00", "LKR", "2", "secret", "BAD_SIGNATURE")

	if ok {
		t.Fatal("expected verification to fail")
	}
}

func TestUpperMD5ProducesUppercaseHexDigest(t *testing.T) {
	if got := upperMD5("abc"); got != "900150983CD24FB0D6963F7D28E17F72" {
		t.Fatalf("unexpected digest: %s", got)
	}
}
