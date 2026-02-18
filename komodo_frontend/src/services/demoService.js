import api from './api'

/**
 * POST /api/demo/generate/ — SuperAdmin only.
 * @returns {Promise<{ orders_created: number, total_generated_revenue: number, total_commission_generated: number }>}
 */
export async function generateDemoActivity() {
  const { data } = await api.post('/demo/generate/')
  return data
}

/**
 * POST /api/demo/flush/ — SuperAdmin only. Deletes all demo-generated orders and reverses wallet impact.
 * @returns {Promise<{ orders_deleted: number, detail: string, errors?: string[] }>}
 */
export async function flushDemoData() {
  const { data } = await api.post('/demo/flush/')
  return data
}

/**
 * POST /api/demo/flush-all/ — SuperAdmin only. Deletes ALL orders and ALL transactions, sets wallet balances to 0.
 * @returns {Promise<{ orders_deleted: number, transactions_deleted: number, detail: string }>}
 */
export async function flushAllDemoData() {
  const { data } = await api.post('/demo/flush-all/')
  return data
}

export default { generateDemoActivity, flushDemoData, flushAllDemoData }
