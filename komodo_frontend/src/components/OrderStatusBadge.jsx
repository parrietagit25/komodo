import './OrderStatusBadge.css'

const STATUS_VARIANTS = ['PENDING', 'PROCESSING', 'PAID', 'CANCELLED', 'CONFIRMED', 'COMPLETED']

const VARIANT_MAP = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  CONFIRMED: 'processing',
  PAID: 'paid',
  COMPLETED: 'paid',
  CANCELLED: 'cancelled',
}

function getVariant(status) {
  if (!status) return 'pending'
  const normalized = String(status).toUpperCase()
  return VARIANT_MAP[normalized] || 'pending'
}

export default function OrderStatusBadge({ status }) {
  const variant = getVariant(status)
  const label = status ? String(status).toUpperCase() : 'PENDING'

  return (
    <span
      className={`order-status-badge order-status-badge--${variant}`}
      title={label}
    >
      {label}
    </span>
  )
}
