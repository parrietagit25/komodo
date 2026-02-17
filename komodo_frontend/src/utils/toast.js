import toast from 'react-hot-toast'

/**
 * Toast helpers — use react-hot-toast with app theme (green / pink / cyan).
 * Global style is configured in App.jsx via <Toaster toastOptions={...} />.
 */

/**
 * Show success toast (green accent).
 * @param {string} message
 * @returns {string} toast id (use with toast.dismiss(id) to close)
 */
export function showSuccess(message) {
  return toast.success(message)
}

/**
 * Show error toast (pink accent).
 * @param {string} message
 * @returns {string} toast id
 */
export function showError(message) {
  return toast.error(message)
}

/**
 * Show loading toast (subtle cyan accent).
 * Dismiss with toast.dismiss(id) or replace with showSuccess/showError using same id.
 * @param {string} message
 * @returns {string} toast id
 */
export function showLoading(message) {
  return toast.loading(message)
}

/** Re-export for toast.dismiss(), toast.promise(), custom options */
export { toast }

export default { showSuccess, showError, showLoading, toast }
