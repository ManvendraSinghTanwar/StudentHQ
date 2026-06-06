'use client'

import { motion } from 'framer-motion'

interface AgentStatusProps {
  agentName: string
  agentIcon: string
  status: 'idle' | 'processing' | 'complete'
}

export function AgentStatus({ agentName, agentIcon, status }: AgentStatusProps) {
  const statusStyles = {
    idle: { color: 'text-muted-foreground', bgColor: 'bg-white/5' },
    processing: { color: 'text-accent', bgColor: 'bg-accent/20' },
    complete: { color: 'text-green-400', bgColor: 'bg-green-500/20' },
  }

  const style = statusStyles[status]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-card ${style.bgColor} border border-white/10`}
    >
      <div className="flex items-center gap-4">
        <motion.div
          animate={status === 'processing' ? { rotate: 360 } : {}}
          transition={
            status === 'processing'
              ? { duration: 2, repeat: Infinity, ease: 'linear' }
              : {}
          }
          className="text-3xl"
        >
          {agentIcon}
        </motion.div>
        <div>
          <p className="font-semibold text-foreground text-sm">{agentName}</p>
          <p className={`text-xs font-medium ${style.color}`}>
            {status === 'idle' && 'Idle'}
            {status === 'processing' && 'Processing...'}
            {status === 'complete' && 'Complete'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
