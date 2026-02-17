import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../../components/Button'
import './Stands.css'

const defaultValues = {
  event: '',
  name: '',
  description: '',
  is_active: true,
}

export default function StandModal({ stand, events, onClose, onSubmit, loading }) {
  const isEdit = !!stand
  const [form, setForm] = useState(defaultValues)

  useEffect(() => {
    if (stand) {
      setForm({
        event: stand.event ?? '',
        name: stand.name ?? '',
        description: stand.description ?? '',
        is_active: !!stand.is_active,
      })
    } else {
      setForm({ ...defaultValues })
    }
  }, [stand])

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const eventId = form.event ? Number(form.event) : null
    if (!eventId) return
    if (!form.name.trim()) return

    const payload = {
      event: eventId,
      name: form.name.trim(),
      description: form.description.trim(),
      is_active: form.is_active,
    }
    onSubmit(payload)
  }

  const canSubmit = form.name.trim() && form.event

  return createPortal(
    <div className="modal-backdrop stands-page-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-content stand-modal border-glow"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stand-modal-title"
      >
        <div className="modal-header">
          <h2 id="stand-modal-title" className="modal-title text-glow-primary">
            {isEdit ? 'Edit Stand' : 'Create Stand'}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="form-label">
            <span>Event *</span>
            <select
              className="form-input form-select"
              value={form.event}
              onChange={handleChange('event')}
              required
            >
              <option value="">Select event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                  {ev.start_date ? ` (${new Date(ev.start_date).toLocaleDateString()})` : ''}
                </option>
              ))}
            </select>
          </label>

          <label className="form-label">
            <span>Name *</span>
            <input
              type="text"
              className="form-input"
              value={form.name}
              onChange={handleChange('name')}
              required
              autoFocus
              placeholder="Stand name"
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
