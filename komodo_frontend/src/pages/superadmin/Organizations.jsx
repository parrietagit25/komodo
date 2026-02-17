import { useState, useEffect, useCallback } from 'react'
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
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null, successMessage: '', confirmLabel: 'Deactivate', variant: 'danger' })

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
        'Failed to load organizations'
      setError(msg)
      setList([])
    } finally {
      setLoading(false)
    }
  }, [])

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
        showSuccess('Organization updated')
      } else {
        await createOrganization(payload)
        showSuccess('Organization created')
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

  const handleDeactivate = (org) => {
    setConfirm({
      open: true,
      title: 'Deactivate organization',
      message: `"${org.name}" will be hidden from the list.`,
      confirmLabel: 'Deactivate',
      successMessage: 'Organization deactivated',
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
          <h1 className="organizations-title text-glow-primary">Organizations</h1>
          <p className="organizations-subtitle">Manage organizations, plans, and commission rates</p>
        </div>
        <Button variant="primary" className="btn-create-org" onClick={handleCreate}>
          + Create Organization
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
            columns={['Name', 'Plan', 'Commission', 'Status', 'Created', 'Actions']}
            rows={5}
            className="organizations-table-wrap"
          />
        ) : list.length === 0 ? (
          <div className="organizations-empty data-loaded-fade-in">
            <p>No organizations yet.</p>
            <Button variant="primary" onClick={handleCreate}>+ Create Organization</Button>
          </div>
        ) : (
          <div className="organizations-table-wrap table-mobile-cards data-loaded-fade-in">
            <table className="organizations-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Plan</th>
                  <th>Commission</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((org) => (
                  <tr key={org.id}>
                    <td className="cell-name" data-label="Name">{org.name}</td>
                    <td data-label="Plan">{org.plan || '—'}</td>
                    <td data-label="Commission">{org.commission_rate != null ? `${Number(org.commission_rate)}%` : '—'}</td>
                    <td data-label="Status">
                      <span className={`status-badge status-${org.is_active ? 'active' : 'inactive'}`}>
                        {org.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="cell-muted" data-label="Created">{formatDate(org.created_at)}</td>
                    <td className="cell-actions" data-label="Actions">
                      <button
                        type="button"
                        className="table-btn table-btn-edit"
                        onClick={() => handleEdit(org)}
                        disabled={actionLoading}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="table-btn table-btn-deactivate"
                        onClick={() => handleDeactivate(org)}
                        disabled={actionLoading}
                      >
                        Deactivate
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
