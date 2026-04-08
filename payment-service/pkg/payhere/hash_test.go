package payhere

import "testing"

func TestFormatAmountAlwaysUsesTwoDecimals(t *testing.T) {
	if got := FormatAmount(100); got != "100.00" {
		t.Fatalf("expected 100.00, got %s", got)
	}
}

func TestComputeHashMatchesKnownVector(t *testing.T) {
	got := ComputeHash("1222359", "order_12345", "1000.00", "LKR", "secret")
	const want = "A61CD349D08BA9DC2E9CFBBB0429273C"

	if got != want {
		t.Fatalf("expected %s, got %s", want, got)
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

func TestVerifyNotifyReturnsFalseForMismatchedSignature(t *testing.T) {
	ok := VerifyNotify("1222359", "order_1", "250.00", "LKR", "2", "secret", "BAD_SIGNATURE")

	if ok {
		t.Fatal("expected verification to fail")
	}
}
