'use client'

import { motion } from 'framer-motion'
import { Notification } from '@/contexts/NotificationContext'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onClear: (id: string) => void
}

const typeStyles = {
  reminder: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', icon: '⏰' },
  alert: { bg: 'bg-red-500/20', border: 'border-red-500/30', icon: '⚠️' },
  info: { bg: 'bg-accent/20', border: 'border-accent/30', icon: 'ℹ️' },
  success: { bg: 'bg-green-500/20', border: 'border-green-500/30', icon: '✓' },
}

function timeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onClear,
}: NotificationItemProps) {
  const style = typeStyles[notification.type]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`glass-card ${style.bg} border ${style.border} ${!notification.read ? 'ring-1 ring-accent' : ''}`}
    >
      <div className="flex gap-3">
        <div className="text-xl flex-shrink-0">{style.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-foreground text-sm">{notification.title}</p>
            <button
              onClick={() => onClear(notification.id)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-3 gap-2">
            <span className="text-xs text-muted-foreground">{timeAgo(notification.timestamp)}</span>
            {!notification.read && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="text-xs px-2 py-1 glass rounded hover:bg-white/20 transition-colors"
              >
                Mark read
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
