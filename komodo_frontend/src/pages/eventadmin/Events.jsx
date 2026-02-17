import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../../services/eventService'
import { getOrganizations } from '../../services/organizationService'
import { showSuccess } from '../../utils/toast'
import { Button } from '../../components/Button'
import ConfirmModal from '../../components/ConfirmModal'
import TableSkeleton from '../../components/TableSkeleton'
import EventModal from './EventModal'
import './Events.css'

export default function Events() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'SUPERADMIN'

  const [list, setList] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null, successMessage: '', confirmLabel: 'Delete', variant: 'danger' })

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getEvents()
      const items = data.results ?? (Array.isArray(data) ? data : [])
      setList(items)
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : null) ||
        err.message ||
        'Failed to load events'
      setError(msg)
      setList([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOrganizations = useCallback(async () => {
    if (!isSuperAdmin) return
    try {
      const data = await getOrganizations()
      const items = data.results ?? (Array.isArray(data) ? data : [])
      setOrganizations(items)
    } catch {
      setOrganizations([])
    }
  }, [isSuperAdmin])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  useEffect(() => {
    if (modalOpen) document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [modalOpen])

  const handleCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (event) => {
    setEditing(event)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const handleSubmitModal = async (payload) => {
    setActionLoading(true)
    setError(null)
    try {
      if (editing) {
        await updateEvent(editing.id, payload)
        showSuccess('Event updated')
      } else {
        await createEvent(payload)
        showSuccess('Event created')
      }
      handleCloseModal()
      await fetchList()
    } catch (err) {
      const msg =
        err.response?.data?.name?.[0] ||
        err.response?.data?.detail ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : null) ||
        err.message ||
        'Request failed'
      setError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = (event) => {
    setConfirm({
      open: true,
      title: 'Delete event',
      message: `"${event.name}" — this cannot be undone.`,
      confirmLabel: 'Delete',
      successMessage: 'Event deleted',
      variant: 'danger',
      onConfirm: async () => {
        await deleteEvent(event.id)
        await fetchList()
      },
    })
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="events-page">
      <header className="events-header">
        <div>
          <h1 className="events-title text-glow-primary">Events</h1>
          <p className="events-subtitle">
            {isSuperAdmin
              ? 'Manage events across all organizations'
              : 'Manage events for your organization'}
          </p>
        </div>
        <Button variant="primary" className="btn-create-event" onClick={handleCreate}>
          + Create Event
        </Button>
      </header>

      {error && (
        <div className="events-error" role="alert">
          {error}
          <button
            type="button"
            className="events-error-dismiss"
            onClick={() => setError(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className="events-card table-card border-glow">
        {loading ? (
          <TableSkeleton
            columns={['Name', 'Organization', 'Start', 'End', 'Status', 'Created', 'Actions']}
            rows={5}
            className="events-table-wrap"
          />
        ) : list.length === 0 ? (
          <div className="events-empty data-loaded-fade-in">
            <p>No events yet.</p>
            <Button variant="primary" onClick={handleCreate}>
              + Create Event
            </Button>
          </div>
        ) : (
          <div className="events-table-wrap data-loaded-fade-in">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Organization</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((ev) => (
                  <tr key={ev.id}>
                    <td className="cell-name">{ev.name}</td>
                    <td>{ev.organization_detail?.name ?? ev.organization ?? '—'}</td>
                    <td className="cell-muted">{formatDateShort(ev.start_date)}</td>
                    <td className="cell-muted">{formatDateShort(ev.end_date)}</td>
                    <td>
                      <span className={`status-badge status-${ev.is_active ? 'active' : 'inactive'}`}>
                        {ev.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="cell-muted">{formatDateShort(ev.created_at)}</td>
                    <td className="cell-actions">
                      <button
                        type="button"
                        className="table-btn table-btn-edit"
                        onClick={() => handleEdit(ev)}
                        disabled={actionLoading}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="table-btn table-btn-deactivate"
                        onClick={() => handleDelete(ev)}
                        disabled={actionLoading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <EventModal
          event={editing}
          organizations={organizations}
          user={user}
          onClose={handleCloseModal}
          onSubmit={handleSubmitModal}
          loading={actionLoading}
        />
      )}

      <ConfirmModal
        isOpen={confirm.open}
        onClose={() => setConfirm((c) => ({ ...c, open: false }))}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        successMessage={confirm.successMessage}
        variant={confirm.variant}
      />
    </div>
  )
}
