import api from './api'

const BASE = '/public'

/**
 * GET /api/public/events/ — active events (USER role)
 * @returns {Promise<Array>}
 */
export async function getPublicEvents() {
  const { data } = await api.get(`${BASE}/events/`)
  return Array.isArray(data?.results) ? data.results : (data && Array.isArray(data) ? data : [])
}

/**
 * GET /api/public/events/{id}/ — single event (USER role)
 * @param {number} id
 * @returns {Promise<object>}
 */
export async function getPublicEvent(id) {
  const { data } = await api.get(`${BASE}/events/${id}/`)
  return data
}

/**
 * GET /api/public/events/{eventId}/stands/ — active stands for event
 * @param {number} eventId
 * @returns {Promise<Array>}
 */
export async function getEventStands(eventId) {
  const { data } = await api.get(`${BASE}/events/${eventId}/stands/`)
  return Array.isArray(data) ? data : []
}

/**
 * GET /api/public/stands/{id}/ — single stand (USER role)
 * @param {number} id
 * @returns {Promise<object>}
 */
export async function getPublicStand(id) {
  const { data } = await api.get(`${BASE}/stands/${id}/`)
  return data
}

/**
 * GET /api/public/stands/{standId}/products/ — available products (stock > 0)
 * @param {number} standId
 * @returns {Promise<Array>}
 */
export async function getStandProducts(standId) {
  const { data } = await api.get(`${BASE}/stands/${standId}/products/`)
  return Array.isArray(data) ? data : []
}

export default {
  getPublicEvents,
  getPublicEvent,
  getEventStands,
  getPublicStand,
  getStandProducts,
}
