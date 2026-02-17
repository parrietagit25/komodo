import api from './api'

const BASE = '/stands'

/**
 * @param {{ search?: string, event?: number, is_active?: boolean, ordering?: string }} params
 * @returns {Promise<{ results: Array, count?: number }>}
 */
export async function getStands(params = {}) {
  const { data } = await api.get(BASE + '/', { params })
  return data
}

/**
 * @param {number} id
 * @returns {Promise<object>}
 */
export async function getStand(id) {
  const { data } = await api.get(`${BASE}/${id}/`)
  return data
}

/**
 * @param {{ event: number, name: string, description?: string, is_active?: boolean }} payload
 * @returns {Promise<object>}
 */
export async function createStand(payload) {
  const { data } = await api.post(BASE + '/', payload)
  return data
}

/**
 * @param {number} id
 * @param {{ event?: number, name?: string, description?: string, is_active?: boolean }} payload
 * @returns {Promise<object>}
 */
export async function updateStand(id, payload) {
  const { data } = await api.patch(`${BASE}/${id}/`, payload)
  return data
}

/**
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteStand(id) {
  await api.delete(`${BASE}/${id}/`)
}

export default {
  getStands,
  getStand,
  createStand,
  updateStand,
  deleteStand,
}
