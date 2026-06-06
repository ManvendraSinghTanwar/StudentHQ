'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface QuickActionButtonProps {
  icon: ReactNode
  label: string
  onClick: () => void
  delay?: number
}

export function QuickActionButton({ icon, label, onClick, delay = 0 }: QuickActionButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 glass-card w-full p-6 text-center"
    >
      <div className="text-4xl">{icon}</div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </motion.button>
  )
}
