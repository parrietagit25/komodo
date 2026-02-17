import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../../components/Button'
import './Products.css'

const defaultValues = {
  stand: '',
  name: '',
  description: '',
  price: '',
  stock_quantity: '',
  is_available: true,
}

export default function ProductModal({ product, stands, onClose, onSubmit, loading }) {
  const isEdit = !!product
  const [form, setForm] = useState(defaultValues)

  useEffect(() => {
    if (product) {
      setForm({
        stand: product.stand ?? '',
        name: product.name ?? '',
        description: product.description ?? '',
        price: product.price != null ? String(product.price) : '',
        stock_quantity: product.stock_quantity != null ? String(product.stock_quantity) : '',
        is_available: !!product.is_available,
      })
    } else {
      setForm({ ...defaultValues })
    }
  }, [product])

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const standId = form.stand ? Number(form.stand) : null
    if (!standId) return
    if (!form.name.trim()) return

    const payload = {
      stand: standId,
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price === '' ? 0 : parseFloat(form.price) || 0,
      stock_quantity: form.stock_quantity === '' ? 0 : parseInt(form.stock_quantity, 10) || 0,
      is_available: form.is_available,
    }
    onSubmit(payload)
  }

  const canSubmit = form.name.trim() && form.stand

  return createPortal(
    <div className="modal-backdrop products-page-modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal-content product-modal border-glow" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <div className="modal-header">
          <h2 id="product-modal-title" className="modal-title text-glow-primary">
            {isEdit ? 'Edit Product' : 'Create Product'}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="form-label">
            <span>Stand *</span>
            <select className="form-input form-select" value={form.stand} onChange={handleChange('stand')} required>
              <option value="">Select stand</option>
              {stands.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="form-label">
            <span>Name *</span>
            <input type="text" className="form-input" value={form.name} onChange={handleChange('name')} required autoFocus placeholder="Product name" />
          </label>
          <label className="form-label">
            <span>Description</span>
            <textarea className="form-input form-textarea" value={form.description} onChange={handleChange('description')} placeholder="Optional" rows={2} />
          </label>
          <label className="form-label">
            <span>Price</span>
            <input type="number" min="0" step="0.01" className="form-input" value={form.price} onChange={handleChange('price')} placeholder="0.00" />
          </label>
          <label className="form-label">
            <span>Stock quantity</span>
            <input type="number" min="0" className="form-input" value={form.stock_quantity} onChange={handleChange('stock_quantity')} placeholder="0" />
          </label>
          <label className="form-label form-label-checkbox">
            <input type="checkbox" checked={form.is_available} onChange={handleChange('is_available')} />
            <span>Available</span>
          </label>
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
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
