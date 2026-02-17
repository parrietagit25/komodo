import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../../components/Button'
import './Events.css'

function toDatetimeLocal(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

const defaultValues = {
  organization: '',
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  is_active: true,
}

export default function EventModal({ event, organizations, user, onClose, onSubmit, loading }) {
  const isEdit = !!event
  const isSuperAdmin = user?.role === 'SUPERADMIN'
  const [form, setForm] = useState(defaultValues)

  useEffect(() => {
    if (event) {
      setForm({
        organization: event.organization ?? '',
        name: event.name ?? '',
        description: event.description ?? '',
        start_date: toDatetimeLocal(event.start_date),
        end_date: toDatetimeLocal(event.end_date),
        is_active: !!event.is_active,
      })
    } else {
      const defaultOrg = isSuperAdmin ? '' : (user?.organization ?? '')
      setForm({
        ...defaultValues,
        organization: defaultOrg,
      })
    }
  }, [event, isSuperAdmin, user?.organization])

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const organizationId = isSuperAdmin
      ? (form.organization ? Number(form.organization) : null)
      : (user?.organization ?? event?.organization ?? null)
    if (!organizationId && isSuperAdmin) return
    if (!form.name.trim()) return

    const payload = {
      organization: organizationId,
      name: form.name.trim(),
      description: form.description.trim(),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      is_active: form.is_active,
    }
    onSubmit(payload)
  }

  const canSubmit = form.name.trim() && (isSuperAdmin ? form.organization : user?.organization)

  return createPortal(
    <div className="modal-backdrop events-page-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-content event-modal border-glow"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
      >
        <div className="modal-header">
          <h2 id="event-modal-title" className="modal-title text-glow-primary">
            {isEdit ? 'Edit Event' : 'Create Event'}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {isSuperAdmin ? (
            <label className="form-label">
              <span>Organization *</span>
              <select
                className="form-input form-select"
                value={form.organization}
                onChange={handleChange('organization')}
                required
              >
                <option value="">Select organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="form-label">
              <span>Organization</span>
              <input
                type="text"
                className="form-input"
                value={user?.organization_name ?? 'Your organization'}
                readOnly
                disabled
              />
            </label>
          )}

          <label className="form-label">
            <span>Name *</span>
            <input
              type="text"
              className="form-input"
              value={form.name}
              onChange={handleChange('name')}
              required
              autoFocus={!isSuperAdmin || !!form.organization}
              placeholder="Event name"
            />
          </label>

          <label className="form-label">
            <span>Description</span>
            <textarea
              className="form-input form-textarea"
              value={form.description}
              onChange={handleChange('description')}
              placeholder="Optional description"
              rows={3}
            />
          </label>

          <label className="form-label">
            <span>Start date</span>
            <input
              type="datetime-local"
              className="form-input"
              value={form.start_date}
              onChange={handleChange('start_date')}
            />
          </label>

          <label className="form-label">
            <span>End date</span>
            <input
              type="datetime-local"
              className="form-input"
              value={form.end_date}
              onChange={handleChange('end_date')}
            />
          </label>

          <label className="form-label form-label-checkbox">
            <input type="checkbox" checked={form.is_active} onChange={handleChange('is_active')} />
            <span>Active</span>
          </label>

          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} disabled={!canSubmit}>
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
