import { useLanguage } from '../context/LanguageContext'
import './OrderStatusBadge.css'

const VARIANT_MAP = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  CONFIRMED: 'processing',
  PAID: 'paid',
  COMPLETED: 'paid',
  CANCELLED: 'cancelled',
}

const LABEL_KEYS = {
  PENDING: 'orders.pending',
  CONFIRMED: 'orders.confirmed',
  COMPLETED: 'orders.completed',
  CANCELLED: 'orders.cancelled',
  PROCESSING: 'orders.pending',
  PAID: 'orders.completed',
}

function getVariant(status) {
  if (!status) return 'pending'
  const normalized = String(status).toUpperCase()
  return VARIANT_MAP[normalized] || 'pending'
}

export default function OrderStatusBadge({ status }) {
  const { t } = useLanguage()
  const variant = getVariant(status)
  const key = status ? LABEL_KEYS[String(status).toUpperCase()] : 'orders.pending'
  const label = key ? t(key) : (status || 'PENDING')

  return (
    <span
      className={`order-status-badge order-status-badge--${variant}`}
      title={label}
    >
      {label}
    </span>
  )
}
