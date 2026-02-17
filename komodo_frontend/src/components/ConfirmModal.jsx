import { useState } from 'react'
import { createPortal } from 'react-dom'
import { showSuccess, showError } from '../utils/toast'
import { Button } from './Button'
import './ConfirmModal.css'

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  successMessage = 'Done',
  variant = 'danger',
}) {
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    if (typeof onConfirm !== 'function') return
    setLoading(true)
    try {
      await onConfirm()
      showSuccess(successMessage)
      onClose()
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Something went wrong'
      showError(msg)
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="confirm-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-modal-title" className="confirm-modal-title">{title}</h2>
        {message && <p className="confirm-modal-message">{message}</p>}
        <div className="confirm-modal-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
