import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import {
  getStands,
  createStand,
  updateStand,
  deleteStand,
} from '../../services/standService'
import { getEvents } from '../../services/eventService'
import { showSuccess } from '../../utils/toast'
import { Button } from '../../components/Button'
import ConfirmModal from '../../components/ConfirmModal'
import TableSkeleton from '../../components/TableSkeleton'
import StandModal from './StandModal'
import './Stands.css'

export default function Stands() {
  const { t } = useLanguage()

  const [list, setList] = useState([])
  const [events, setEvents] = useState([])
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
      const data = await getStands()
      const items = data.results ?? (Array.isArray(data) ? data : [])
      setList(items)
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : null) ||
        err.message ||
        t('stands.failedLoad')
      setError(msg)
      setList([])
    } finally {
      setLoading(false)
    }
  }, [t])

  const fetchEvents = useCallback(async () => {
    try {
      const data = await getEvents()
      const items = data.results ?? (Array.isArray(data) ? data : [])
      setEvents(items)
    } catch {
      setEvents([])
    }
  }, [])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (modalOpen) document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [modalOpen])

  const handleCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (stand) => {
    setEditing(stand)
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
        await updateStand(editing.id, payload)
        showSuccess(t('stands.updated'))
      } else {
        await createStand(payload)
        showSuccess(t('stands.created'))
      }
      handleCloseModal()
      await fetchList()
    } catch (err) {
      const msg =
        err.response?.data?.name?.[0] ||
        err.response?.data?.detail ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : null) ||
        err.message ||
        t('common.requestFailed')
      setError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = (stand) => {
    setConfirm({
      open: true,
      title: t('stands.deleteTitle'),
      message: t('stands.deleteMessage'),
      confirmLabel: t('common.delete'),
      successMessage: t('stands.deleteSuccess'),
      variant: 'danger',
      onConfirm: async () => {
        await deleteStand(stand.id)
        await fetchList()
      },
    })
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="stands-page">
      <header className="stands-header">
        <div>
          <h1 className="stands-title text-glow-primary">{t('stands.title')}</h1>
          <p className="stands-subtitle">{t('stands.subtitle')}</p>
        </div>
        <Button variant="primary" className="btn-create-stand" onClick={handleCreate}>
          {t('stands.createStandButton')}
        </Button>
      </header>

      {error && (
        <div className="stands-error" role="alert">
          {error}
          <button
            type="button"
            className="stands-error-dismiss"
            onClick={() => setError(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className="stands-card table-card border-glow">
        {loading ? (
          <TableSkeleton
            columns={[t('stands.name'), t('stands.event'), t('common.status'), t('stands.createdAt'), t('common.actions')]}
            rows={5}
            className="stands-table-wrap"
          />
        ) : list.length === 0 ? (
          <div className="stands-empty data-loaded-fade-in">
            <p>{t('stands.noStandsYet')}</p>
            <Button variant="primary" onClick={handleCreate}>
              {t('stands.createStandButton')}
            </Button>
          </div>
        ) : (
          <div className="stands-table-wrap data-loaded-fade-in">
            <table className="stands-table">
              <thead>
                <tr>
                  <th>{t('stands.name')}</th>
                  <th>{t('stands.event')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('stands.createdAt')}</th>
                  <th className="th-actions">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((stand) => (
                  <tr key={stand.id}>
                    <td className="cell-name">{stand.name}</td>
                    <td>{stand.event_detail?.name ?? stand.event ?? '—'}</td>
                    <td>
                      <span className={`status-badge status-${stand.is_active ? 'active' : 'inactive'}`}>
                        {stand.is_active ? t('stands.isActive') : t('stands.inactive')}
                      </span>
                    </td>
                    <td className="cell-muted">{formatDate(stand.created_at)}</td>
                    <td className="cell-actions">
                      <button
                        type="button"
                        className="table-btn table-btn-edit"
                        onClick={() => handleEdit(stand)}
                        disabled={actionLoading}
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        type="button"
                        className="table-btn table-btn-deactivate"
                        onClick={() => handleDelete(stand)}
                        disabled={actionLoading}
                      >
                        {t('common.delete')}
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
        <StandModal
          stand={editing}
          events={events}
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
