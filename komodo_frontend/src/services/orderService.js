import api from './api'

const BASE = '/orders'

/**
 * @param {{ search?: string, stand?: number, status?: string, user?: number, ordering?: string }} params
 * @returns {Promise<{ results: Array, count?: number }>}
 */
export async function getOrders(params = {}) {
  const { data } = await api.get(BASE + '/', { params })
  return data
}

/**
 * @param {number} id
 * @returns {Promise<object>}
 */
export async function getOrder(id) {
  const { data } = await api.get(`${BASE}/${id}/`)
  return data
}

/**
 * @param {{ stand: number, status?: string, total_amount?: number, notes?: string, items: Array<{ product: number, quantity: number, unit_price: number }> }} payload
 * @returns {Promise<object>}
 */
export async function createOrder(payload) {
  const { data } = await api.post(BASE + '/', payload)
  return data
}

/**
 * @param {number} id
 * @param {{ status?: string, total_amount?: number, notes?: string }} payload
 * @returns {Promise<object>}
 */
export async function updateOrder(id, payload) {
  const { data } = await api.patch(`${BASE}/${id}/`, payload)
  return data
}

export default {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
}
