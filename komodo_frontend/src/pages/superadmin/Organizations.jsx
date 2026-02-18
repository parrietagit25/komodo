import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import {
  getOrganizations,
  createOrganization,
  updateOrganization,
  deactivateOrganization,
} from '../../services/organizationService'
import { showSuccess } from '../../utils/toast'
import { Button } from '../../components/Button'
import ConfirmModal from '../../components/ConfirmModal'
import TableSkeleton from '../../components/TableSkeleton'
import OrganizationModal from './OrganizationModal'
import './Organizations.css'

export default function Organizations() {
  const { t } = useLanguage()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null, successMessage: '', confirmLabel: '', variant: 'danger' })

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getOrganizations()
      const items = data.results ?? (Array.isArray(data) ? data : [])
      setList(items)
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : null) ||
        err.message ||
        t('organizations.failedLoad')
      setError(msg)
      setList([])
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    if (modalOpen) document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [modalOpen])

  const handleCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (org) => {
    setEditing(org)
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
        await updateOrganization(editing.id, payload)
        showSuccess(t('organizations.updated'))
      } else {
        await createOrganization(payload)
        showSuccess(t('organizations.created'))
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

  const handleDeactivate = (org) => {
    setConfirm({
      open: true,
      title: t('organizations.deactivateTitle'),
      message: `"${org.name}" ${t('organizations.deactivateMessage')}`,
      confirmLabel: t('common.deactivate'),
      successMessage: t('organizations.deactivateSuccess'),
      variant: 'danger',
      onConfirm: async () => {
        await deactivateOrganization(org.id)
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
    <div className="organizations-page">
      <header className="organizations-header">
        <div>
          <h1 className="organizations-title text-glow-primary">{t('organizations.title')}</h1>
          <p className="organizations-subtitle">{t('organizations.subtitle')}</p>
        </div>
        <Button variant="primary" className="btn-create-org" onClick={handleCreate}>
          {t('organizations.createOrgButton')}
        </Button>
      </header>

      {error && (
        <div className="organizations-error" role="alert">
          {error}
          <button type="button" className="organizations-error-dismiss" onClick={() => setError(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <div className="organizations-card table-card border-glow">
        {loading ? (
          <TableSkeleton
            columns={[t('organizations.name'), t('organizations.plan'), t('organizations.commission'), t('common.status'), t('organizations.createdDate'), t('common.actions')]}
            rows={5}
            className="organizations-table-wrap"
          />
        ) : list.length === 0 ? (
          <div className="organizations-empty data-loaded-fade-in">
            <p>{t('organizations.empty')}</p>
            <Button variant="primary" onClick={handleCreate}>{t('organizations.createOrgButton')}</Button>
          </div>
        ) : (
          <div className="organizations-table-wrap table-mobile-cards data-loaded-fade-in">
            <table className="organizations-table">
              <thead>
                <tr>
                  <th>{t('organizations.name')}</th>
                  <th>{t('organizations.plan')}</th>
                  <th>{t('organizations.commission')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('organizations.createdDate')}</th>
                  <th className="th-actions">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((org) => (
                  <tr key={org.id}>
                    <td className="cell-name" data-label={t('organizations.name')}>{org.name}</td>
                    <td data-label={t('organizations.plan')}>{org.plan || '—'}</td>
                    <td data-label={t('organizations.commission')}>{org.commission_rate != null ? `${Number(org.commission_rate)}%` : '—'}</td>
                    <td data-label={t('common.status')}>
                      <span className={`status-badge status-${org.is_active ? 'active' : 'inactive'}`}>
                        {org.is_active ? t('organizations.activeLabel') : t('organizations.inactiveLabel')}
                      </span>
                    </td>
                    <td className="cell-muted" data-label={t('organizations.createdDate')}>{formatDate(org.created_at)}</td>
                    <td className="cell-actions" data-label={t('common.actions')}>
                      <button
                        type="button"
                        className="table-btn table-btn-edit"
                        onClick={() => handleEdit(org)}
                        disabled={actionLoading}
                      >
                        {t('organizations.edit')}
                      </button>
                      <button
                        type="button"
                        className="table-btn table-btn-deactivate"
                        onClick={() => handleDeactivate(org)}
                        disabled={actionLoading}
                      >
                        {t('common.deactivate')}
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
        <OrganizationModal
          organization={editing}
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
