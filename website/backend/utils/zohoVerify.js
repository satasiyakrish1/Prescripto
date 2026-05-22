import crypto from 'crypto'

// Verify Zoho webhook using HMAC SHA256 with signing key
export function verifyZohoWebhook(rawBody, signature) {
  try {
    // Check if we're in development/test mode
    if (process.env.NODE_ENV === 'development' && process.env.ZOHO_PAYMENTS_TEST_MODE === 'true') {
      console.log('[ZohoPayments] Test mode - webhook verification bypassed');
      return true;
    }
    
    const signingKey = process.env.ZOHO_PAYMENTS_SIGNING_KEY
    if (!signingKey || !signature) return false
    const expected = crypto.createHmac('sha256', signingKey).update(rawBody).digest('hex')
    return expected === signature
  } catch (e) {
    console.error('Zoho webhook verification error:', e)
    return false
  }
}


