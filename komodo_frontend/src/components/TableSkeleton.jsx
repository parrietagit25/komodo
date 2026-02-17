import './TableSkeleton.css'

/**
 * Reusable table skeleton for loading states.
 * @param {string[]} columns - Header labels (defines column count)
 * @param {number} rows - Number of skeleton rows
 * @param {string} [className] - Optional wrapper class (e.g. users-table-wrap)
 */
export default function TableSkeleton({ columns = [], rows = 5, className = '' }) {
  const colCount = columns.length || 1
  return (
    <div className={`table-skeleton-wrap ${className}`.trim()} aria-busy="true" aria-label="Loading">
      <table className="table-skeleton">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: colCount }, (_, cellIndex) => (
                <td key={cellIndex}>
                  <span className="skeleton-line" style={{ width: cellIndex === 0 ? '70%' : cellIndex === colCount - 1 ? '60px' : '85%' }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
