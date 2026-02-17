import api from './api'

const BASE = '/audit'

/**
 * GET /api/audit/reconcile/ — SuperAdmin only.
 * @returns {Promise<{ total_orders_checked: number, inconsistencies_found: number, details: Array }>}
 */
export async function getReconcile() {
  const { data } = await api.get(`${BASE}/reconcile/`)
  return data
}

/**
 * GET /api/audit/balance/ — SuperAdmin only. Global wallet vs ledger verification.
 * @returns {Promise<{ wallet_total: number, ledger_total: number, difference: number }>}
 */
export async function getBalance() {
  const { data } = await api.get(`${BASE}/balance/`)
  return data
}

/**
 * GET /api/audit/export/?start_date=&end_date= — SuperAdmin only. Triggers CSV download.
 * @param {string} [startDate] - YYYY-MM-DD
 * @param {string} [endDate] - YYYY-MM-DD
 * @returns {Promise<Blob>} - CSV file blob
 */
export async function exportCsv(startDate, endDate) {
  const params = new URLSearchParams()
  if (startDate) params.set('start_date', startDate)
  if (endDate) params.set('end_date', endDate)
  const { data } = await api.get(`${BASE}/export/`, {
    params,
    responseType: 'blob',
  })
  return data
}

export default { getReconcile, getBalance, exportCsv }
