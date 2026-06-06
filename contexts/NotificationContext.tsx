'use client'

import React, { createContext, useContext, useState } from 'react'

export interface Notification {
  id: string
  title: string
  message: string
  timestamp: Date
  read: boolean
  type: 'reminder' | 'alert' | 'info' | 'success'
  actionUrl?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  markAsRead: (id: string) => void
  clearNotification: (id: string) => void
  notificationsEnabled: boolean
  setNotificationsEnabled: (enabled: boolean) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Assignment Due Tomorrow',
    message: 'Your Data Structures assignment is due in 24 hours',
    timestamp: new Date(Date.now() - 3600000),
    read: false,
    type: 'reminder',
  },
  {
    id: '2',
    title: 'Study Recommendation',
    message: 'Based on your notes, we recommend reviewing Chapter 5',
    timestamp: new Date(Date.now() - 7200000),
    read: true,
    type: 'info',
  },
  {
    id: '3',
    title: 'Expense Alert',
    message: 'Your monthly budget is 80% used',
    timestamp: new Date(Date.now() - 86400000),
    read: false,
    type: 'alert',
  },
]

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  const unreadCount = notifications.filter(n => !n.read).length

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
    }
    setNotifications(prev => [newNotification, ...prev])
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        clearNotification,
        notificationsEnabled,
        setNotificationsEnabled,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
