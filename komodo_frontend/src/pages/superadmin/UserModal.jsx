import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../../components/Button'
import './Users.css'

const ROLES = [
  { value: 'SUPERADMIN', label: 'Super Admin' },
  { value: 'EVENT_ADMIN', label: 'Event Admin' },
  { value: 'STAND_ADMIN', label: 'Stand Admin' },
  { value: 'USER', label: 'User' },
]

const STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
]

const defaultValues = {
  username: '',
  email: '',
  password: '',
  password_confirm: '',
  first_name: '',
  last_name: '',
  role: 'USER',
  status: 'PENDING',
  organization: '',
  event: '',
  stand: '',
  is_active: true,
}

export default function UserModal({ user, organizations, events, stands, onClose, onSubmit, loading }) {
  const isEdit = !!user
  const [form, setForm] = useState(defaultValues)

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username ?? '',
        email: user.email ?? '',
        password: '',
        password_confirm: '',
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        role: user.role ?? 'USER',
        status: user.status ?? 'PENDING',
        organization: user.organization ?? '',
        event: user.event ?? '',
        stand: user.stand ?? '',
        is_active: user.is_active !== false,
      })
    } else {
      setForm({ ...defaultValues })
    }
  }, [user])

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.username.trim()) return
    if (!isEdit && (!form.password || form.password !== form.password_confirm)) return

    if (isEdit) {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim() || undefined,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        role: form.role,
        status: form.status,
        organization: form.organization ? Number(form.organization) : null,
        event: form.event ? Number(form.event) : null,
        stand: form.stand ? Number(form.stand) : null,
        is_active: form.is_active,
      }
      onSubmit(payload)
    } else {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
        password_confirm: form.password_confirm,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        role: form.role,
        status: form.status,
        organization: form.organization ? Number(form.organization) : null,
        event: form.event ? Number(form.event) : null,
        stand: form.stand ? Number(form.stand) : null,
      }
      onSubmit(payload)
    }
  }

  const canSubmit = form.username.trim() && (isEdit || (form.password && form.password === form.password_confirm))

  return createPortal(
    <div className="modal-backdrop users-page-modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal-content user-modal border-glow" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
        <div className="modal-header">
          <h2 id="user-modal-title" className="modal-title text-glow-primary">
            {isEdit ? 'Edit User' : 'Register User'}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form user-modal-form">
          <label className="form-label">
            <span>Username *</span>
            <input type="text" className="form-input" value={form.username} onChange={handleChange('username')} required autoFocus placeholder="Username" />
          </label>
          <label className="form-label">
            <span>Email</span>
            <input type="email" className="form-input" value={form.email} onChange={handleChange('email')} placeholder="email@example.com" />
          </label>
          {!isEdit && (
            <>
              <label className="form-label">
                <span>Password *</span>
                <input type="password" className="form-input" value={form.password} onChange={handleChange('password')} required placeholder="••••••••" />
              </label>
              <label className="form-label">
                <span>Confirm password *</span>
                <input type="password" className="form-input" value={form.password_confirm} onChange={handleChange('password_confirm')} required placeholder="••••••••" />
              </label>
            </>
          )}
          <label className="form-label">
            <span>First name</span>
            <input type="text" className="form-input" value={form.first_name} onChange={handleChange('first_name')} placeholder="First name" />
          </label>
          <label className="form-label">
            <span>Last name</span>
            <input type="text" className="form-input" value={form.last_name} onChange={handleChange('last_name')} placeholder="Last name" />
          </label>
          <label className="form-label">
            <span>Role *</span>
            <select className="form-input form-select" value={form.role} onChange={handleChange('role')} required>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>
          <label className="form-label">
            <span>Status</span>
            <select className="form-input form-select" value={form.status} onChange={handleChange('status')}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="form-label">
            <span>Organization</span>
            <select className="form-input form-select" value={form.organization} onChange={handleChange('organization')}>
              <option value="">—</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </label>
          <label className="form-label">
            <span>Event</span>
            <select className="form-input form-select" value={form.event} onChange={handleChange('event')}>
              <option value="">—</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </label>
          <label className="form-label">
            <span>Stand</span>
            <select className="form-input form-select" value={form.stand} onChange={handleChange('stand')}>
              <option value="">—</option>
              {stands.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          {isEdit && (
            <label className="form-label form-label-checkbox">
              <input type="checkbox" checked={form.is_active} onChange={handleChange('is_active')} />
              <span>Active (can log in)</span>
            </label>
          )}
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="primary" loading={loading} disabled={!canSubmit}>
              {isEdit ? 'Save' : 'Register'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
