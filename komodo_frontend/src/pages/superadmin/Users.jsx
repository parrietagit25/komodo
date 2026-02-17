import { useState, useEffect, useCallback } from 'react'
import {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
  restoreUser,
} from '../../services/userService'
import { getOrganizations } from '../../services/organizationService'
import { getEvents } from '../../services/eventService'
import { getStands } from '../../services/standService'
import { showSuccess } from '../../utils/toast'
import { Button } from '../../components/Button'
import ConfirmModal from '../../components/ConfirmModal'
import TableSkeleton from '../../components/TableSkeleton'
import UserModal from './UserModal'
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
  { value: 'DELETED', label: 'Deleted' },
]

export default function Users() {
  const [list, setList] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [events, setEvents] = useState([])
  const [stands, setStands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeactivated, setShowDeactivated] = useState(false)
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null, successMessage: '', confirmLabel: 'Confirm', variant: 'danger' })

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getUsers()
      const items = data.results ?? (Array.isArray(data) ? data : [])
      setList(items)
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : null) ||
        err.message ||
        'Failed to load users'
      setError(msg)
      setList([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOptions = useCallback(async () => {
    try {
      const [orgsRes, eventsRes, standsRes] = await Promise.all([
        getOrganizations().catch(() => ({ results: [] })),
        getEvents().catch(() => ({ results: [] })),
        getStands().catch(() => ({ results: [] })),
      ])
      setOrganizations(orgsRes.results ?? (Array.isArray(orgsRes) ? orgsRes : []))
      setEvents(eventsRes.results ?? (Array.isArray(eventsRes) ? eventsRes : []))
      setStands(standsRes.results ?? (Array.isArray(standsRes) ? standsRes : []))
    } catch {
      setOrganizations([])
      setEvents([])
      setStands([])
    }
  }, [])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  useEffect(() => {
    if (modalOpen) document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [modalOpen])

  const handleCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (user) => {
    setEditing(user)
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
        await updateUser(editing.id, payload)
        showSuccess('User updated')
      } else {
        await createUser(payload)
        showSuccess('User registered')
      }
      handleCloseModal()
      await fetchList()
    } catch (err) {
      const msg =
        err.response?.data?.username?.[0] ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.password?.[0] ||
        err.response?.data?.detail ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : null) ||
        err.message ||
        'Request failed'
      setError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivate = (user) => {
    setConfirm({
      open: true,
      title: 'Desactivar usuario',
      message: `"${user.username}" no podrá iniciar sesión.`,
      confirmLabel: 'Desactivar',
      successMessage: 'Usuario desactivado',
      variant: 'danger',
      onConfirm: async () => {
        await deactivateUser(user.id)
        await fetchList()
      },
    })
  }

  const handleRestore = (user) => {
    setConfirm({
      open: true,
      title: 'Restaurar usuario',
      message: `¿Restaurar "${user.username}"?`,
      confirmLabel: 'Restaurar',
      successMessage: 'Usuario restaurado',
      variant: 'primary',
      onConfirm: async () => {
        await restoreUser(user.id)
        await fetchList()
      },
    })
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getRoleLabel = (role) => ROLES.find((r) => r.value === role)?.label ?? role
  const getStatusLabel = (status) => STATUSES.find((s) => s.value === status)?.label ?? status

  const getOrgName = (id) => organizations.find((o) => o.id === id)?.name ?? (id ? `#${id}` : '—')
  const getEventName = (id) => events.find((e) => e.id === id)?.name ?? (id ? `#${id}` : '—')
  const getStandName = (id) => stands.find((s) => s.id === id)?.name ?? (id ? `#${id}` : '—')

  const displayList = showDeactivated ? list : list.filter((u) => !u.is_deleted)

  return (
    <div className="users-page">
      <header className="users-header">
        <div>
          <h1 className="users-title text-glow-primary">Users</h1>
          <p className="users-subtitle">Register, view, edit and deactivate users</p>
        </div>
        <div className="users-header-actions">
          <label className="users-filter-check">
            <input
              type="checkbox"
              checked={showDeactivated}
              onChange={(e) => setShowDeactivated(e.target.checked)}
            />
            <span>Show deactivated</span>
          </label>
          <Button variant="primary" className="btn-create-user" onClick={handleCreate}>
            + Register User
          </Button>
        </div>
      </header>

      {error && (
        <div className="users-error" role="alert">
          {error}
          <button type="button" className="users-error-dismiss" onClick={() => setError(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      <div className="users-card table-card border-glow">
        {loading && list.length === 0 ? (
          <TableSkeleton
            columns={['Username', 'Email', 'Role', 'Status', 'Organization', 'Event', 'Stand', 'Joined', 'Actions']}
            rows={6}
            className="users-table-wrap"
          />
        ) : displayList.length === 0 ? (
          <div className="users-empty data-loaded-fade-in">
            <p>{showDeactivated ? 'No deactivated users.' : 'No users found.'}</p>
            <Button variant="primary" onClick={handleCreate}>+ Register User</Button>
          </div>
        ) : (
          <div className="users-table-wrap data-loaded-fade-in">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Organization</th>
                  <th>Event</th>
                  <th>Stand</th>
                  <th>Joined</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map((u) => (
                  <tr key={u.id} className={u.is_deleted ? 'row-deactivated' : ''}>
                    <td className="cell-name">{u.username}</td>
                    <td className="cell-muted">{u.email || '—'}</td>
                    <td>{getRoleLabel(u.role)}</td>
                    <td>
                      <span className={`status-badge status-${(u.status || '').toLowerCase()}`}>
                        {getStatusLabel(u.status)}
                      </span>
                    </td>
                    <td className="cell-muted">{getOrgName(u.organization)}</td>
                    <td className="cell-muted">{getEventName(u.event)}</td>
                    <td className="cell-muted">{getStandName(u.stand)}</td>
                    <td className="cell-muted">{formatDate(u.date_joined)}</td>
                    <td className="cell-actions">
                      <button
                        type="button"
                        className="table-btn table-btn-edit"
                        onClick={() => handleEdit(u)}
                        disabled={actionLoading}
                      >
                        Edit
                      </button>
                      {u.is_deleted ? (
                        <button
                          type="button"
                          className="table-btn table-btn-restore"
                          onClick={() => handleRestore(u)}
                          disabled={actionLoading}
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="table-btn table-btn-deactivate"
                          onClick={() => handleDeactivate(u)}
                          disabled={actionLoading}
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <UserModal
          user={editing}
          organizations={organizations}
          events={events}
          stands={stands}
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
