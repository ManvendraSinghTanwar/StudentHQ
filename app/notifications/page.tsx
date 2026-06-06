'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { NotificationItem } from '@/components/notifications/NotificationItem'
import { AppProvider } from '@/contexts/AppContext'
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext'

function NotificationsContent() {
  const { notifications, markAsRead, clearNotification, notificationsEnabled, setNotificationsEnabled } =
    useNotifications()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filteredNotifications =
    filter === 'unread' ? notifications.filter(n => !n.read) : notifications

  return (
    <div className="min-h-screen bg-background pb-32 pt-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Stay updated with your AI assistant</p>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔔</span>
              <h2 className="font-semibold text-foreground">Notifications</h2>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${
                notificationsEnabled ? 'bg-accent' : 'bg-white/10'
              }`}
            >
              <motion.div
                layout
                className={`w-5 h-5 rounded-full bg-white transition-all ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {notificationsEnabled ? 'Notifications are enabled' : 'Notifications are disabled'}
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'unread'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'glass-card bg-primary text-primary-foreground'
                  : 'glass-card bg-white/5 text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? 'All' : 'Unread'} ({filteredNotifications.length})
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">✨</p>
            <p className="text-foreground font-medium">All caught up!</p>
            <p className="text-muted-foreground text-sm mt-1">
              {filter === 'unread'
                ? 'No unread notifications'
                : 'You have no notifications yet'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 300 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onClear={clearNotification}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Notification Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card"
        >
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <span>⚙️</span>
            Notification Preferences
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Assignment Reminders', enabled: true },
              { label: 'Study Reminders', enabled: true },
              { label: 'Event Alerts', enabled: true },
              { label: 'Budget Alerts', enabled: false },
            ].map(pref => (
              <div key={pref.label} className="flex items-center justify-between">
                <label className="text-sm text-foreground">{pref.label}</label>
                <button className={`w-10 h-6 rounded-full transition-colors ${
                  pref.enabled ? 'bg-accent' : 'bg-white/10'
                }`}>
                  <motion.div
                    layout
                    className={`w-5 h-5 rounded-full bg-white transition-all ${
                      pref.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <BottomNavigation />
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <AppProvider>
      <NotificationProvider>
        <NotificationsContent />
      </NotificationProvider>
    </AppProvider>
  )
}
