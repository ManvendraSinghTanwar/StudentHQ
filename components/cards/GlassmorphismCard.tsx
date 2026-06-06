'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface GlassmorphismCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
  delay?: number
}

export function GlassmorphismCard({
  children,
  className = '',
  onClick,
  hover = true,
  delay = 0,
}: GlassmorphismCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`glass-card cursor-pointer ${className}`}
      onClick={onClick}
      whileHover={hover ? { y: -4, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.15)' } : {}}
    >
      {children}
    </motion.div>
  )
}
