import api from './api'

const BASE = '/organizations'

/**
 * @returns {Promise<{ data: Array, count?: number }>}
 */
export async function getOrganizations(params = {}) {
  const { data } = await api.get(BASE + '/', { params })
  return data
}

/**
 * @param {{ name: string, plan?: string, commission_rate?: number, is_active?: boolean }} payload
 * @returns {Promise<{ data: object }>}
 */
export async function createOrganization(payload) {
  const { data } = await api.post(BASE + '/', payload)
  return data
}

/**
 * @param {number} id
 * @param {{ name?: string, plan?: string, commission_rate?: number, is_active?: boolean }} payload
 * @returns {Promise<{ data: object }>}
 */
export async function updateOrganization(id, payload) {
  const { data } = await api.patch(`${BASE}/${id}/`, payload)
  return data
}

/**
 * Soft delete (deactivate) organization.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deactivateOrganization(id) {
  await api.post(`${BASE}/${id}/soft_delete/`)
}

/**
 * Restore soft-deleted organization.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function restoreOrganization(id) {
  await api.post(`${BASE}/${id}/restore/`)
}

export default {
  getOrganizations,
  createOrganization,
  updateOrganization,
  deactivateOrganization,
  restoreOrganization,
}
