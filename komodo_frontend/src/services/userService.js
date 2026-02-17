import api from './api'

const BASE = '/users'

/**
 * @param {{ search?: string, role?: string, status?: string, organization?: number, is_deleted?: boolean, ordering?: string }} params
 * @returns {Promise<{ results: Array, count?: number }>}
 */
export async function getUsers(params = {}) {
  const { data } = await api.get(BASE + '/', { params })
  return data
}

/**
 * @param {number} id
 * @returns {Promise<object>}
 */
export async function getUser(id) {
  const { data } = await api.get(`${BASE}/${id}/`)
  return data
}

/**
 * @param {object} payload - username, email, password, password_confirm, first_name, last_name, role, status, organization?, event?, stand?
 * @returns {Promise<object>}
 */
export async function createUser(payload) {
  const { data } = await api.post(BASE + '/', payload)
  return data
}

/**
 * @param {number} id
 * @param {object} payload - username, email, first_name, last_name, role, status, organization?, event?, stand?, is_active?
 * @returns {Promise<object>}
 */
export async function updateUser(id, payload) {
  const { data } = await api.patch(`${BASE}/${id}/`, payload)
  return data
}

/**
 * Soft delete (deactivate) user.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deactivateUser(id) {
  await api.post(`${BASE}/${id}/deactivate/`)
}

/**
 * Restore soft-deleted user.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function restoreUser(id) {
  await api.post(`${BASE}/${id}/restore/`)
}

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  restoreUser,
}
