import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { createOrder } from '../../services/orderService'
import { getMyWallet } from '../../services/walletService'
import { Button } from '../../components/Button'
import './Purchase.css'

export default function Checkout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { standId, standName, items, setQuantity, removeItem, totalAmount, clearCart, isEmpty } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [walletBalance, setWalletBalance] = useState(null)
  const redirectTimeoutRef = useRef(null)

  useEffect(() => {
    if (user?.role !== 'USER') return
    getMyWallet().then((w) => setWalletBalance(Number(w?.balance ?? 0))).catch(() => {})
  }, [user?.role])

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [])

  const paysWithWallet = user?.role === 'USER'
  const hasEnoughBalance = walletBalance != null && walletBalance >= totalAmount
  const confirmDisabled =
    submitting ||
    paymentSuccess ||
    (paysWithWallet && walletBalance != null && !hasEnoughBalance)

  const handleConfirm = async () => {
    if (!standId || items.length === 0 || confirmDisabled) return
    setError(null)
    setSubmitting(true)
    try {
      const orderPayload = {
        stand: standId,
        total_amount: String(totalAmount.toFixed(2)),
        items: items.map((i) => ({
          product: i.productId,
          quantity: i.quantity,
          unit_price: String(i.unit_price.toFixed(2)),
        })),
      }
      await createOrder(orderPayload)
      clearCart()
      setSubmitting(false)
      setPaymentSuccess(true)
      redirectTimeoutRef.current = setTimeout(() => {
        navigate('/orders', { state: { orderSuccess: true } })
      }, 2000)
    } catch (e) {
      setSubmitting(false)
      const detail = e.response?.data?.detail
      setError(
        typeof detail === 'string' ? detail : (detail?.detail ?? e.message ?? 'Payment could not be completed. Please try again.')
      )
    }
  }

  const handleRetry = () => {
    setError(null)
  }

  if (isEmpty) {
    return (
      <div className="checkout-page">
        <h1 className="checkout-title text-glow-primary">Checkout</h1>
        <p className="checkout-subtitle">Your cart is empty</p>
        <div className="checkout-empty">
          <p>Add products from a stand to place an order.</p>
          <p><Link to="/user/events">Browse events</Link></p>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <h1 className="checkout-title text-glow-primary">Checkout</h1>
      <p className="checkout-subtitle">Review and confirm your order</p>

      {error && (
        <div className="checkout-error-card" role="alert">
          <p className="checkout-error-message">{error}</p>
          <Button variant="secondary" className="checkout-retry-btn" onClick={handleRetry}>
            Try again
          </Button>
        </div>
      )}

      <div className={`checkout-card ${submitting || paymentSuccess ? 'checkout-card-dimmed' : ''}`}>
        {standName && <p className="checkout-stand-name">Stand: {standName}</p>}
        <ul className="checkout-list">
          {items.map((item) => (
            <li key={item.productId} className="checkout-item">
              <div>
                <span className="checkout-item-name">{item.name}</span>
                <span className="checkout-item-qty">× {item.quantity}</span>
              </div>
              <div className="checkout-item-actions">
                <button
                  type="button"
                  className="purchase-back"
                  onClick={() => setQuantity(item.productId, item.quantity - 1)}
                  disabled={item.quantity <= 1 || submitting}
                  aria-label="Decrease"
                >
                  −
                </button>
                <span style={{ margin: '0 0.5rem', minWidth: '1.5rem', textAlign: 'center' }}>{item.quantity}</span>
                <button
                  type="button"
                  className="purchase-back"
                  onClick={() => setQuantity(item.productId, item.quantity + 1)}
                  disabled={submitting}
                  aria-label="Increase"
                >
                  +
                </button>
                <button
                  type="button"
                  className="purchase-back"
                  onClick={() => removeItem(item.productId)}
                  style={{ marginLeft: '0.5rem' }}
                  disabled={submitting}
                  aria-label="Remove"
                >
                  Remove
                </button>
              </div>
              <span className="checkout-item-price">
                ${(item.unit_price * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <div className="checkout-total">
          <span>Total</span>
          <span className="text-glow-primary">${totalAmount.toFixed(2)}</span>
        </div>

        {paysWithWallet && walletBalance != null && (
          <div className="checkout-wallet-balance">
            <span className="checkout-wallet-label">Wallet balance</span>
            <span className={`checkout-wallet-amount ${hasEnoughBalance ? 'text-glow-primary' : 'checkout-wallet-insufficient'}`}>
              ${walletBalance.toFixed(2)}
            </span>
            {!hasEnoughBalance && (
              <span className="checkout-wallet-insufficient-text">Insufficient funds</span>
            )}
          </div>
        )}

        <Button
          variant="primary"
          className="checkout-confirm-btn"
          onClick={handleConfirm}
          loading={submitting}
          disabled={confirmDisabled}
        >
          Confirm Order
        </Button>
      </div>

      {/* Full-screen overlay: processing */}
      {submitting && (
        <div className="checkout-overlay" role="status" aria-live="polite">
          <div className="checkout-overlay-content">
            <div className="checkout-spinner" aria-hidden />
            <p className="checkout-overlay-text">Processing secure payment...</p>
          </div>
        </div>
      )}

      {/* Full-screen overlay: success */}
      {paymentSuccess && (
        <div className="checkout-overlay checkout-overlay-success" role="status" aria-live="polite">
          <div className="checkout-overlay-content">
            <div className="checkout-success-checkmark" aria-hidden>
              <svg viewBox="0 0 52 52" className="checkout-checkmark-svg">
                <circle className="checkout-checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkout-checkmark-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <p className="checkout-overlay-text checkout-success-text">Payment successful!</p>
            <p className="checkout-overlay-sub">Redirecting to orders...</p>
          </div>
        </div>
      )}
    </div>
  )
}
