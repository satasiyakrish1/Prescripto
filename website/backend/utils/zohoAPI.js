import axios from 'axios'
import { getZohoPaymentsConfig } from '../config/zohoPaymentsConfig.js'
import { getAccessToken, refreshAccessToken } from './zohoOAuth.js'

// Helper to call Zoho Payments Orders API
export async function createZohoOrder({ amount, customer_email, description }) {
  const cfg = getZohoPaymentsConfig()
  const apiRoot = cfg.apiRoot
  const accountId = cfg.accountId

  if (!apiRoot || !accountId) {
    return { success: false, status: 500, error: 'Zoho configuration missing: API root or Account ID' }
  }

  const payload = {
    amount: Number(Number(amount).toFixed(2)),
    currency: process.env.CURRENCY || 'INR',
    description,
    customer: customer_email ? { email: customer_email } : undefined
  }

  // Remove undefined fields
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])

  const attempts = []
  const buildHeaders = (token) => ({
    'Authorization': `Zoho-oauthtoken ${token}`,
    'X-Account-Id': accountId,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  })

  const url = `${apiRoot}/orders`
  const doRequest = async (bearer) => axios.post(url, payload, { headers: buildHeaders(bearer) })

  try {
    const token = process.env.ZOHO_PAYMENTS_OAUTH_TOKEN || await getAccessToken()
    attempts.push('initial')
    let { data } = await doRequest(token)
    const orderId = data?.order?.order_id || data?.order_id || data?.id
    const paymentLink = data?.order?.payment_url || data?.payment_url || data?.url
    return { success: true, status: 200, data, orderId, paymentLink }
  } catch (err) {
    const res = err?.response
    if (!process.env.ZOHO_PAYMENTS_OAUTH_TOKEN && (res?.status === 401 || res?.status === 403)) {
      try {
        const newToken = await refreshAccessToken()
        attempts.push('refresh')
        const { data } = await doRequest(newToken)
        const orderId = data?.order?.order_id || data?.order_id || data?.id
        const paymentLink = data?.order?.payment_url || data?.payment_url || data?.url
        return { success: true, status: 200, data, orderId, paymentLink }
      } catch (retryErr) {
        const rres = retryErr?.response
        const msg = rres?.data?.message || rres?.data?.error || retryErr.message
        return { success: false, status: rres?.status || 500, error: msg }
      }
    }
    const msg = res?.data?.message || res?.data?.error || err.message
    return { success: false, status: res?.status || 500, error: msg }
  }
}


