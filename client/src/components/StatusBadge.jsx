const StatusBadge = ({ status }) => {
  const getStatusStyle = (status) => {
    if (!status) return { background: '#ffffff22', color: '#fff' }
    const normalizedStatus = status.toLowerCase()
    if (normalizedStatus === 'approved') return { background: '#22c55e22', color: '#22c55e' }
    if (normalizedStatus === 'needs_revision' || normalizedStatus === 'under_review')
      return { background: '#f9731622', color: '#f97316' }
    if (normalizedStatus === 'rejected') return { background: '#ef444422', color: '#ef4444' }
    return { background: '#ffffff22', color: '#fff' }
  }

  const displayStatus = status ? status.replace('_', ' ').toUpperCase() : 'UNKNOWN'
  const statusStyle = getStatusStyle(status)

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 14px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        ...statusStyle
      }}
    >
      {displayStatus}
    </span>
  )
}

export default StatusBadge
