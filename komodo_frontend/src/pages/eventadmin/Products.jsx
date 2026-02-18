import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../services/productService'
import { getStands } from '../../services/standService'
import { showSuccess } from '../../utils/toast'
import { Button } from '../../components/Button'
import ConfirmModal from '../../components/ConfirmModal'
import TableSkeleton from '../../components/TableSkeleton'
import ProductModal from './ProductModal'
import './Products.css'

export default function Products() {
  const { t } = useLanguage()
  const [list, setList] = useState([])
  const [stands, setStands] = useState([])
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
      const data = await getProducts()
      const items = data.results ?? (Array.isArray(data) ? data : [])
      setList(items)
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : null) ||
        err.message ||
        t('products.failedLoad')
      setError(msg)
      setList([])
    } finally {
      setLoading(false)
    }
  }, [t])

  const fetchStands = useCallback(async () => {
    try {
      const data = await getStands()
      const items = data.results ?? (Array.isArray(data) ? data : [])
      setStands(items)
    } catch {
      setStands([])
    }
  }, [])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    fetchStands()
  }, [fetchStands])

  useEffect(() => {
    if (modalOpen) document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [modalOpen])

  const handleCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (product) => {
    setEditing(product)
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
        await updateProduct(editing.id, payload)
        showSuccess(t('products.updated'))
      } else {
        await createProduct(payload)
        showSuccess(t('products.created'))
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

  const handleDelete = (product) => {
    setConfirm({
      open: true,
      title: t('products.deleteTitle'),
      message: t('products.deleteMessage'),
      confirmLabel: t('common.delete'),
      successMessage: t('products.deleteSuccess'),
      variant: 'danger',
      onConfirm: async () => {
        await deleteProduct(product.id)
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

  const formatPrice = (n) => {
    if (n == null) return '—'
    return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="products-page">
      <header className="products-header">
        <div>
          <h1 className="products-title text-glow-primary">{t('products.title')}</h1>
          <p className="products-subtitle">{t('products.subtitle')}</p>
        </div>
        <Button variant="primary" className="btn-create-product" onClick={handleCreate}>
          {t('products.createProductButton')}
        </Button>
      </header>

      {error && (
        <div className="products-error" role="alert">
          {error}
          <button type="button" className="products-error-dismiss" onClick={() => setError(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      <div className="products-card table-card border-glow">
        {loading ? (
          <TableSkeleton
            columns={[t('products.name'), t('products.stand'), t('products.price'), t('products.stock'), t('common.status'), t('products.createdAt'), t('common.actions')]}
            rows={5}
            className="products-table-wrap"
          />
        ) : list.length === 0 ? (
          <div className="products-empty data-loaded-fade-in">
            <p>{t('products.noProductsYet')}</p>
            <Button variant="primary" onClick={handleCreate}>{t('products.createProductButton')}</Button>
          </div>
        ) : (
          <div className="products-table-wrap data-loaded-fade-in">
            <table className="products-table">
              <thead>
                <tr>
                  <th>{t('products.name')}</th>
                  <th>{t('products.stand')}</th>
                  <th>{t('products.price')}</th>
                  <th>{t('products.stock')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('products.createdAt')}</th>
                  <th className="th-actions">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id}>
                    <td className="cell-name">{p.name}</td>
                    <td>{p.stand ? (stands.find(s => s.id === p.stand)?.name ?? `#${p.stand}`) : '—'}</td>
                    <td className="cell-num">{formatPrice(p.price)}</td>
                    <td className="cell-num">{p.stock_quantity != null ? p.stock_quantity : '—'}</td>
                    <td>
                      <span className={`status-badge status-${p.is_available ? 'active' : 'inactive'}`}>
                        {p.is_available ? t('products.available') : t('products.unavailable')}
                      </span>
                    </td>
                    <td className="cell-muted">{formatDate(p.created_at)}</td>
                    <td className="cell-actions">
                      <button type="button" className="table-btn table-btn-edit" onClick={() => handleEdit(p)} disabled={actionLoading}>{t('common.edit')}</button>
                      <button type="button" className="table-btn table-btn-deactivate" onClick={() => handleDelete(p)} disabled={actionLoading}>{t('common.delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <ProductModal
          product={editing}
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
