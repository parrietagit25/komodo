import './Button.css'

const variants = {
  primary: 'btn-primary glow-primary',
  secondary: 'btn-secondary glow-secondary',
  danger: 'btn-danger glow-danger',
  info: 'btn-info glow-info',
  ghost: 'btn-ghost',
}

export function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  ...rest
}) {
  const isDisabled = disabled || loading
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`btn ${variants[variant] || variants.primary} ${loading ? 'btn-loading' : ''} ${className}`.trim()}
      {...rest}
    >
      {loading && <span className="btn-spinner" aria-hidden />}
      {children}
    </button>
  )
}

export default Button
