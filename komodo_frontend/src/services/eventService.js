import api from './api'

const BASE = '/events'

/**
 * @param {{ search?: string, organization?: number, is_active?: boolean, ordering?: string }} params
 * @returns {Promise<{ results: Array, count?: number }>}
 */
export async function getEvents(params = {}) {
  const { data } = await api.get(BASE + '/', { params })
  return data
}

/**
 * @param {number} id
 * @returns {Promise<object>}
 */
export async function getEvent(id) {
  const { data } = await api.get(`${BASE}/${id}/`)
  return data
}

/**
 * @param {{ organization: number, name: string, description?: string, start_date?: string, end_date?: string, is_active?: boolean }} payload
 * @returns {Promise<object>}
 */
export async function createEvent(payload) {
  const { data } = await api.post(BASE + '/', payload)
  return data
}

/**
 * @param {number} id
 * @param {{ organization?: number, name?: string, description?: string, start_date?: string, end_date?: string, is_active?: boolean }} payload
 * @returns {Promise<object>}
 */
export async function updateEvent(id, payload) {
  const { data } = await api.patch(`${BASE}/${id}/`, payload)
  return data
}

/**
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteEvent(id) {
  await api.delete(`${BASE}/${id}/`)
}

export default {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
}
