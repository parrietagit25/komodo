import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../../components/Button'
import './Organizations.css'

const defaultValues = {
  name: '',
  plan: '',
  commission_rate: '',
  is_active: true,
}

export default function OrganizationModal({ organization, onClose, onSubmit, loading }) {
  const isEdit = !!organization
  const [form, setForm] = useState(defaultValues)
  const [touched, setTouched] = useState({})

  useEffect(() => {
    if (organization) {
      setForm({
        name: organization.name ?? '',
        plan: organization.plan ?? '',
        commission_rate: organization.commission_rate != null ? String(organization.commission_rate) : '',
        is_active: !!organization.is_active,
      })
    } else {
      setForm({ ...defaultValues })
    }
    setTouched({})
  }, [organization])

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      plan: form.plan.trim(),
      commission_rate: form.commission_rate === '' ? 0 : parseFloat(form.commission_rate) || 0,
      is_active: form.is_active,
    }
    if (!payload.name) return
    onSubmit(payload)
  }

  return createPortal(
    <div className="modal-backdrop organizations-page-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-content organization-modal border-glow"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title text-glow-primary">
            {isEdit ? 'Edit Organization' : 'Create Organization'}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="form-label">
            <span>Name *</span>
            <input
              type="text"
              className="form-input"
              value={form.name}
              onChange={handleChange('name')}
              required
              autoFocus
              placeholder="Organization name"
            />
          </label>
          <label className="form-label">
            <span>Plan</span>
            <input
              type="text"
              className="form-input"
              value={form.plan}
              onChange={handleChange('plan')}
              placeholder="e.g. Pro, Enterprise"
            />
          </label>
          <label className="form-label">
            <span>Commission rate (%)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="form-input"
              value={form.commission_rate}
              onChange={handleChange('commission_rate')}
              placeholder="0"
            />
          </label>
          <label className="form-label form-label-checkbox">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={handleChange('is_active')}
            />
            <span>Active</span>
          </label>
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} disabled={!form.name.trim()}>
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
