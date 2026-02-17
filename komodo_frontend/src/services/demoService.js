import api from './api'

/**
 * POST /api/demo/generate/ — SuperAdmin only.
 * @returns {Promise<{ orders_created: number, total_generated_revenue: number, total_commission_generated: number }>}
 */
export async function generateDemoActivity() {
  const { data } = await api.post('/demo/generate/')
  return data
}

export default { generateDemoActivity }
