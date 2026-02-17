import api from './api'

const BASE = '/wallet'

/**
 * GET /api/wallet/me/ — current user's wallet
 * @returns {Promise<{ id, user, balance, currency, created_at, updated_at }>}
 */
export async function getMyWallet() {
  const { data } = await api.get(`${BASE}/me/`)
  return data
}

/**
 * GET /api/wallet/transactions/ — current user's transactions
 * @returns {Promise<Array>}
 */
export async function getMyTransactions() {
  const { data } = await api.get(`${BASE}/transactions/`)
  return Array.isArray(data) ? data : []
}

/**
 * POST /api/wallet/add-funds/ — add balance to a user's wallet (EVENT_ADMIN, SUPERADMIN only)
 * @param {{ user_id: number, amount: number|string, description?: string }} payload
 * @returns {Promise<object>}
 */
export async function addFunds(payload) {
  const { data } = await api.post(`${BASE}/add-funds/`, payload)
  return data
}

export default {
  getMyWallet,
  getMyTransactions,
  addFunds,
}
