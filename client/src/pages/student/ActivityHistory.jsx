import React, { useEffect, useState, useCallback } from 'react'
import { getNotifications, markOneRead, markAllRead } from '../../services/api'

const TYPE_META = {
  status_change: { label: 'Status Update', color: '#FFBE4F' },
  new_comment:   { label: 'New Comment',   color: '#60a5fa' },
  assignment:    { label: 'Assignment',    color: '#a78bfa' },
  system:        { label: 'System',        color: 'rgba(255,255,255,0.4)' },
}

const ActivityHistory = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState(null)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getNotifications()
      setNotifications(res.data.data || [])
    } catch (e) {
      console.error(e)
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const handleMarkOne = async (notifId) => {
    try {
      await markOneRead(notifId)
      setNotifications(prev =>
        prev.map(n =>
          n.notification_id === notifId ? { ...n, is_read: 1 } : n
        )
      )
    } catch (e) {
      console.error(e)
    }
  }

  const handleMarkAll = async () => {
    try {
      await markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
    } catch (e) {
      console.error(e)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.heading}>
            Activity History
            {unreadCount > 0 && (
              <span style={{
                marginLeft: '10px',
                fontSize: '14px',
                fontWeight: '700',
                background: 'rgba(255,190,79,0.15)',
                color: '#FFBE4F',
                padding: '2px 10px',
                borderRadius: '999px',
              }}>
                {unreadCount} new
              </span>
            )}
          </h2>
          <p style={styles.subheading}>Stay updated on your submissions and activity</p>
        </div>
        {unreadCount > 0 && (
          <button style={styles.markAllButton} onClick={handleMarkAll}>
            Mark all as read
          </button>
        )}
      </div>

      {loading && <div style={styles.loadingText}>Loading...</div>}
      {error   && <div style={styles.errorText}>{error}</div>}

      {!loading && notifications.length === 0 && (
        <div style={styles.emptyState}>
          🔔 You have no notifications yet.
        </div>
      )}

      <div style={styles.list}>
        {notifications.map(n => {
          const meta    = TYPE_META[n.type] || TYPE_META.system
          const isRead  = Boolean(n.is_read)
          return (
            <div key={n.notification_id} style={styles.card(isRead)}>
              <div style={styles.cardLeft}>
                <div style={styles.dot(meta.color)} />
                <div style={styles.cardBody}>
                  <div style={styles.typeBadge(meta.color)}>{meta.label}</div>
                  <p style={styles.message(isRead)}>{n.message}</p>
                  <p style={styles.meta}>{formatDate(n.created_at)}</p>
                </div>
              </div>
              {!isRead && (
                <button
                  style={styles.readButton}
                  onClick={() => handleMarkOne(n.notification_id)}
                >
                  Mark read
                </button>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}

const styles = {
  container: {
    padding: '2rem',
    color: '#fff',
    minHeight: '100vh',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
  },
  heading: {
    fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
    fontWeight: '700',
    margin: '0 0 0.25rem 0',
  },
  subheading: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    marginTop: '4px',
  },
  markAllButton: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
    marginBottom: '1rem',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: '14px',
    marginBottom: '1rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: 'rgba(255,255,255,0.3)',
    fontSize: '15px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  card: (isRead) => ({
    background: isRead ? '#ffffff07' : '#ffffff12',
    border: `1px solid ${isRead ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.15)'}`,
    borderRadius: '14px',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    transition: 'background 0.2s ease',
  }),
  cardLeft: {
    display: 'flex',
    gap: '14px',
    alignItems: 'flex-start',
    flex: 1,
  },
  dot: (color) => ({
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
    marginTop: '5px',
  }),
  cardBody: {
    flex: 1,
  },
  typeBadge: (color) => ({
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color,
    marginBottom: '4px',
  }),
  message: (isRead) => ({
    fontSize: '14px',
    color: isRead ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.9)',
    lineHeight: 1.5,
    margin: '0 0 6px 0',
  }),
  meta: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.35)',
    margin: 0,
  },
  readButton: {
    padding: '5px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  unreadIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#FFBE4F',
    flexShrink: 0,
    marginTop: '6px',
  },
}

export default ActivityHistory