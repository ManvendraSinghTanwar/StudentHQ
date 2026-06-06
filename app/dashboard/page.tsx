'use client'

import { motion } from 'framer-motion'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { GlassmorphismCard } from '@/components/cards/GlassmorphismCard'
import { AppProvider } from '@/contexts/AppContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { mockDashboardData } from '@/lib/mock-data'

function DashboardContent() {
  const { upcomingDeadlines, studyTasks, expenseSummary, healthRecommendations, recentActions } =
    mockDashboardData

  return (
    <div className="min-h-screen bg-background pb-32 pt-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your study and life overview</p>
        </motion.div>

        {/* Upcoming Deadlines */}
        <GlassmorphismCard delay={0.1}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📅</span>
            <h2 className="text-lg font-bold text-foreground">Upcoming Deadlines</h2>
          </div>
          <div className="space-y-2">
            {upcomingDeadlines.map(deadline => (
              <div key={deadline.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="font-medium text-foreground text-sm">{deadline.title}</p>
                  <p className="text-xs text-muted-foreground">{deadline.subject}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-accent/20 text-accent rounded">
                  {deadline.daysLeft}d
                </span>
              </div>
            ))}
          </div>
        </GlassmorphismCard>

        {/* Study Tasks */}
        <GlassmorphismCard delay={0.2}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📚</span>
            <h2 className="text-lg font-bold text-foreground">Study Tasks</h2>
          </div>
          <div className="space-y-2">
            {studyTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <input
                  type="checkbox"
                  checked={task.completed}
                  readOnly
                  className="w-5 h-5 accent-accent"
                />
                <div className="flex-1">
                  <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  task.priority === 'high'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </GlassmorphismCard>

        {/* Expense Summary */}
        <GlassmorphismCard delay={0.3}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">💰</span>
            <h2 className="text-lg font-bold text-foreground">Expense Summary</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Spent this month</p>
                <p className="text-2xl font-bold text-foreground">${expenseSummary.spent}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="text-2xl font-bold text-muted-foreground">${expenseSummary.total}</p>
              </div>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '80%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {expenseSummary.categories.map(cat => (
                <div key={cat.name} className="p-2 bg-white/5 rounded-lg">
                  <p className="text-xs text-muted-foreground">{cat.name}</p>
                  <p className="font-bold text-foreground">${cat.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassmorphismCard>

        {/* Health Recommendations */}
        <GlassmorphismCard delay={0.4}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">❤️</span>
            <h2 className="text-lg font-bold text-foreground">Health Tips</h2>
          </div>
          <div className="space-y-2">
            {healthRecommendations.map((rec, i) => (
              <div key={i} className="flex gap-3 p-3 bg-white/5 rounded-lg">
                <span>✓</span>
                <p className="text-sm text-foreground">{rec}</p>
              </div>
            ))}
          </div>
        </GlassmorphismCard>

        {/* Recent Actions */}
        <GlassmorphismCard delay={0.5}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚡</span>
            <h2 className="text-lg font-bold text-foreground">Recent Actions</h2>
          </div>
          <div className="space-y-2">
            {recentActions.map(action => (
              <div key={action.id} className="p-3 bg-white/5 rounded-lg">
                <p className="text-sm text-foreground">{action.action}</p>
                <p className="text-xs text-muted-foreground mt-1">{action.time}</p>
              </div>
            ))}
          </div>
        </GlassmorphismCard>
      </div>

      <BottomNavigation />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AppProvider>
      <NotificationProvider>
        <DashboardContent />
      </NotificationProvider>
    </AppProvider>
  )
}
