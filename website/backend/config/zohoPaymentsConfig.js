import 'dotenv/config'

// Centralized Zoho Payments configuration
// Reads from process.env and derives regional endpoints

function trimOrNull(value) {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  return v.length ? v : null;
}

function deriveApiRoot(accountsBaseEnv, apiRootEnv) {
  if (apiRootEnv) return apiRootEnv;
  const accounts = accountsBaseEnv || '';
  if (accounts.includes('.zoho.in')) return 'https://payments.zoho.in/api/v1';
  return 'https://payments.zoho.com/api/v1';
}

export function getZohoPaymentsConfig() {
  const accountsBase = trimOrNull(process.env.ZOHO_ACCOUNTS_BASE) || 'https://accounts.zoho.in';
  const apiRoot = trimOrNull(process.env.ZOHO_PAYMENTS_API_ROOT) || deriveApiRoot(accountsBase, null);

  return {
    accountsBase,
    apiRoot,
    accountId: trimOrNull(process.env.ZOHO_PAYMENTS_ACCOUNT_ID),
    accountName: trimOrNull(process.env.ZOHO_PAYMENTS_ACCOUNT_NAME),
    signingKey: trimOrNull(process.env.ZOHO_PAYMENTS_SIGNING_KEY),
    clientId: trimOrNull(process.env.ZOHO_CLIENT_ID),
    clientSecret: trimOrNull(process.env.ZOHO_CLIENT_SECRET),
    refreshToken: trimOrNull(process.env.ZOHO_REFRESH_TOKEN),
    staticToken: trimOrNull(process.env.ZOHO_PAYMENTS_OAUTH_TOKEN)
  }
}

export function getAlternateApiRoot(primaryRoot) {
  if (!primaryRoot) return null;
  if (primaryRoot.includes('.zoho.in')) return primaryRoot.replace('.zoho.in', '.zoho.com');
  if (primaryRoot.includes('.zoho.com')) return primaryRoot.replace('.zoho.com', '.zoho.in');
  return null;
}


