import api from './api'

const BASE = '/stands/products'

/**
 * @param {{ search?: string, stand?: number, is_available?: boolean, ordering?: string }} params
 * @returns {Promise<{ results: Array, count?: number }>}
 */
export async function getProducts(params = {}) {
  const { data } = await api.get(BASE + '/', { params })
  return data
}

/**
 * @param {number} id
 * @returns {Promise<object>}
 */
export async function getProduct(id) {
  const { data } = await api.get(`${BASE}/${id}/`)
  return data
}

/**
 * @param {{ stand: number, name: string, description?: string, price?: number, stock_quantity?: number, is_available?: boolean }} payload
 * @returns {Promise<object>}
 */
export async function createProduct(payload) {
  const { data } = await api.post(BASE + '/', payload)
  return data
}

/**
 * @param {number} id
 * @param {{ stand?: number, name?: string, description?: string, price?: number, stock_quantity?: number, is_available?: boolean }} payload
 * @returns {Promise<object>}
 */
export async function updateProduct(id, payload) {
  const { data } = await api.patch(`${BASE}/${id}/`, payload)
  return data
}

/**
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteProduct(id) {
  await api.delete(`${BASE}/${id}/`)
}

export default {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
}
