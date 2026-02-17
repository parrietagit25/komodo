import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPublicStand, getStandProducts } from '../../services/publicService'
import { useCart } from '../../context/CartContext'
import { Card, CardHeader, CardTitle, CardBody } from '../../components/Card'
import { Button } from '../../components/Button'
import './Purchase.css'

export default function UserStandProducts() {
  const { standId } = useParams()
  const navigate = useNavigate()
  const { addItem, standId: cartStandId, itemCount } = useCart()
  const [stand, setStand] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!standId) return
      try {
        setError(null)
        const [standData, productsList] = await Promise.all([
          getPublicStand(standId),
          getStandProducts(standId),
        ])
        if (!cancelled) {
          setStand(standData)
          setProducts(productsList)
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.detail || 'Failed to load products')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [standId])

  const handleAddToCart = (product, qty = 1) => {
    addItem(Number(standId), stand?.name ?? null, product, qty)
  }

  if (loading) {
    return (
      <div className="purchase-page">
        <header className="purchase-header">
          <h1 className="purchase-title text-glow-primary">Products</h1>
          <p className="purchase-subtitle">Loading…</p>
        </header>
        <div className="purchase-loading">
          <span className="loader neon-loader" aria-hidden />
          <span>Loading products…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="purchase-page">
      <header className="purchase-header purchase-header-row">
        <div>
          <nav className="purchase-breadcrumb">
            <button type="button" className="purchase-back" onClick={() => navigate(-1)}>
              ← Back
            </button>
          </nav>
          <h1 className="purchase-title text-glow-primary">{stand?.name ?? 'Products'}</h1>
          <p className="purchase-subtitle">Add items to cart</p>
        </div>
        {itemCount > 0 && (
          <Button
            variant="primary"
            className="purchase-cart-btn"
            onClick={() => navigate('/user/checkout')}
          >
            Cart ({itemCount})
          </Button>
        )}
      </header>
      {error && (
        <div className="purchase-error" role="alert">
          {error}
        </div>
      )}
      <div className="purchase-grid">
        {products.length === 0 && !error && (
          <p className="purchase-empty">No products available.</p>
        )}
        {products.map((product) => {
          const price = product.price != null ? Number(product.price) : 0
          const stock = product.stock_quantity != null ? Number(product.stock_quantity) : 0
          return (
            <Card key={product.id} className="purchase-card purchase-product-card">
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
              </CardHeader>
              <CardBody>
                {product.description && <p className="purchase-product-desc">{product.description}</p>}
                <div className="purchase-product-meta">
                  <span className="purchase-price text-glow-primary">${price.toFixed(2)}</span>
                  <span className="purchase-muted">Stock: {stock}</span>
                </div>
                <Button
                  variant="primary"
                  className="purchase-add-btn"
                  onClick={() => handleAddToCart(product)}
                  disabled={stock === 0}
                >
                  Add to cart
                </Button>
              </CardBody>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
