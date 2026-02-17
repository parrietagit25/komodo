import api from './api'

const BASE = '/dashboard'

/**
 * GET /api/dashboard/superadmin/ — SuperAdmin only
 * @returns {Promise<{ total_sales, total_commission, total_net_to_stands, orders_today }>}
 */
export async function getSuperAdminMetrics() {
  const { data } = await api.get(`${BASE}/superadmin/`)
  return data
}

/**
 * GET /api/dashboard/eventadmin/ — EventAdmin (scoped by organization)
 * @returns {Promise<{ total_sales, total_commission, total_net_to_stands, orders_today }>}
 */
export async function getEventAdminMetrics() {
  const { data } = await api.get(`${BASE}/eventadmin/`)
  return data
}

/**
 * GET /api/dashboard/standadmin/ — StandAdmin (scoped by stand)
 * @returns {Promise<{ total_sales, total_net_received, orders_today }>}
 */
export async function getStandAdminMetrics() {
  const { data } = await api.get(`${BASE}/standadmin/`)
  return data
}

/**
 * GET /api/dashboard/sales-chart/ — Last 7 days by role (SuperAdmin / EventAdmin / StandAdmin)
 * @returns {Promise<Array<{ date: string, total_sales: number, commission: number, net: number }>>}
 */
export async function getSalesChart() {
  const { data } = await api.get(`${BASE}/sales-chart/`)
  return data
}

/**
 * GET /api/dashboard/financial-overview/ — SuperAdmin only
 * @returns {Promise<{
 *   total_revenue: number, total_commission: number, total_paid_to_stands: number,
 *   total_orders: number, active_users: number, avg_ticket: number,
 *   top_organizations: Array<{ name: string, revenue: number, commission: number, orders: number }>,
 *   top_stands: Array<{ name: string, revenue: number, orders: number }>,
 *   monthly_revenue: Array<{ month: string, revenue: number, commission: number }>
 * }>}
 */
export async function getFinancialOverview() {
  const { data } = await api.get(`${BASE}/financial-overview/`)
  return data
}

export default {
  getSuperAdminMetrics,
  getEventAdminMetrics,
  getStandAdminMetrics,
  getSalesChart,
  getFinancialOverview,
}
