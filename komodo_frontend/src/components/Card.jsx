import './Card.css'

export function Card({ children, className = '', glow = true, ...rest }) {
  return (
    <div
      className={`card border-glow ${glow ? 'card-glow' : ''} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return <div className={`card-header ${className}`.trim()}>{children}</div>
}

export function CardTitle({ children, className = '' }) {
  return <h2 className={`card-title text-glow-primary ${className}`.trim()}>{children}</h2>
}

export function CardBody({ children, className = '' }) {
  return <div className={`card-body ${className}`.trim()}>{children}</div>
}

export default Card
