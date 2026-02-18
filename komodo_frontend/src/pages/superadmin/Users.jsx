import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../../context/LanguageContext'
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
  { value: 'SUPERADMIN', labelKey: 'users.roleSuperAdmin' },
  { value: 'EVENT_ADMIN', labelKey: 'users.roleEventAdmin' },
  { value: 'STAND_ADMIN', labelKey: 'users.roleStandAdmin' },
  { value: 'USER', labelKey: 'users.roleUser' },
]

const STATUSES = [
  { value: 'PENDING', labelKey: 'users.statusPending' },
  { value: 'ACTIVE', labelKey: 'users.statusActive' },
  { value: 'SUSPENDED', labelKey: 'users.statusSuspended' },
  { value: 'DELETED', labelKey: 'users.statusDeleted' },
]

export default function Users() {
  const { t } = useLanguage()
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
        t('users.failedLoad')
      setError(msg)
      setList([])
    } finally {
      setLoading(false)
    }
  }, [t])

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
        showSuccess(t('users.updated'))
      } else {
        await createUser(payload)
        showSuccess(t('users.userRegistered'))
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
        t('common.requestFailed')
      setError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivate = (user) => {
    setConfirm({
      open: true,
      title: t('users.deactivateTitle'),
      message: t('users.deactivateMessage'),
      confirmLabel: t('common.deactivate'),
      successMessage: t('users.deactivateSuccess'),
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
      title: t('users.restoreTitle'),
      message: t('users.restoreMessage'),
      confirmLabel: t('users.restore'),
      successMessage: t('users.restoreSuccess'),
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

  const getRoleLabel = (role) => {
    const r = ROLES.find((x) => x.value === role)
    return r ? t(r.labelKey) : role
  }
  const getStatusLabel = (status) => {
    const s = STATUSES.find((x) => x.value === status)
    return s ? t(s.labelKey) : status
  }

  const getOrgName = (id) => organizations.find((o) => o.id === id)?.name ?? (id ? `#${id}` : '—')
  const getEventName = (id) => events.find((e) => e.id === id)?.name ?? (id ? `#${id}` : '—')
  const getStandName = (id) => stands.find((s) => s.id === id)?.name ?? (id ? `#${id}` : '—')

  const displayList = showDeactivated ? list : list.filter((u) => !u.is_deleted)

  return (
    <div className="users-page">
      <header className="users-header">
        <div>
          <h1 className="users-title text-glow-primary">{t('users.title')}</h1>
          <p className="users-subtitle">{t('users.subtitle')}</p>
        </div>
        <div className="users-header-actions">
          <label className="users-filter-check">
            <input
              type="checkbox"
              checked={showDeactivated}
              onChange={(e) => setShowDeactivated(e.target.checked)}
            />
            <span>{t('users.showDeactivated')}</span>
          </label>
          <Button variant="primary" className="btn-create-user" onClick={handleCreate}>
            {t('users.createUserButton')}
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
            columns={[t('users.username'), t('users.email'), t('users.role'), t('users.status'), t('users.organization'), t('events.title'), t('stands.title'), t('users.joined'), t('common.actions')]}
            rows={6}
            className="users-table-wrap"
          />
        ) : displayList.length === 0 ? (
          <div className="users-empty data-loaded-fade-in">
            <p>{showDeactivated ? t('users.noDeactivatedUsers') : t('users.noUsersFound')}</p>
            <Button variant="primary" onClick={handleCreate}>{t('users.createUserButton')}</Button>
          </div>
        ) : (
          <div className="users-table-wrap data-loaded-fade-in">
            <table className="users-table">
              <thead>
                <tr>
                  <th>{t('users.username')}</th>
                  <th>{t('users.email')}</th>
                  <th>{t('users.role')}</th>
                  <th>{t('users.status')}</th>
                  <th>{t('users.organization')}</th>
                  <th>{t('events.title')}</th>
                  <th>{t('stands.title')}</th>
                  <th>{t('users.joined')}</th>
                  <th className="th-actions">{t('common.actions')}</th>
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
                        {t('users.edit')}
                      </button>
                      {u.is_deleted ? (
                        <button
                          type="button"
                          className="table-btn table-btn-restore"
                          onClick={() => handleRestore(u)}
                          disabled={actionLoading}
                        >
                          {t('users.restore')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="table-btn table-btn-deactivate"
                          onClick={() => handleDeactivate(u)}
                          disabled={actionLoading}
                        >
                          {t('common.deactivate')}
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
