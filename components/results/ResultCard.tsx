'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ResultCardProps {
  title: string
  icon: string
  children: ReactNode
  delay?: number
}

export function ResultCard({ title, icon, children, delay = 0 }: ResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </motion.div>
  )
}
