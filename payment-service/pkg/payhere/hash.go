package payhere

import (
	"crypto/md5"
	"fmt"
	"strings"
)

// ComputeHash generates the PayHere checkout hash (server-side only).
//
// Formula:
//
//	UPPERCASE(MD5(merchant_id + order_id + amount_formatted + currency + UPPERCASE(MD5(merchant_secret))))
//
// amount must already be formatted to 2 decimal places (e.g. "1000.00").
func ComputeHash(merchantID, orderID, amount, currency, merchantSecret string) string {
	secretHash := upperMD5(merchantSecret)
	raw := merchantID + orderID + amount + currency + secretHash
	return upperMD5(raw)
}

// VerifyNotify verifies the md5sig in a PayHere notify (webhook) callback.
//
// Formula:
//
//	UPPERCASE(MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + UPPERCASE(MD5(merchant_secret))))
//
// Returns true if the received md5sig matches the locally computed value.
func VerifyNotify(merchantID, orderID, payhereAmount, payhereCurrency, statusCode, merchantSecret, receivedMd5sig string) bool {
	secretHash := upperMD5(merchantSecret)
	raw := merchantID + orderID + payhereAmount + payhereCurrency + statusCode + secretHash
	expected := upperMD5(raw)
	return expected == strings.ToUpper(receivedMd5sig)
}

// FormatAmount formats a float64 amount to the 2-decimal-place string required by PayHere.
func FormatAmount(amount float64) string {
	return fmt.Sprintf("%.2f", amount)
}

func upperMD5(s string) string {
	return strings.ToUpper(fmt.Sprintf("%x", md5.Sum([]byte(s))))
}
