'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface AgentWorkflowProps {
  activeAgent: string | null
}

const workflowSteps = [
  { id: 'input', label: 'Input Received', icon: '📥' },
  { id: 'router', label: 'Router Agent', icon: '🔀' },
  { id: 'processing', label: 'Processing', icon: '⚙️' },
  { id: 'agents', label: 'Specialized Agents', icon: '🤖' },
  { id: 'output', label: 'Action Generated', icon: '✨' },
]

const agentTypes = [
  { id: 'study', name: 'Study Agent', icon: '📚' },
  { id: 'schedule', name: 'Schedule Agent', icon: '📅' },
  { id: 'expense', name: 'Expense Agent', icon: '💰' },
  { id: 'content', name: 'Content Agent', icon: '📄' },
  { id: 'health', name: 'Health Agent', icon: '❤️' },
]

export function AgentWorkflow({ activeAgent }: AgentWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % workflowSteps.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full space-y-8">
      {/* Main workflow steps */}
      <div className="flex items-center justify-between gap-2 px-2">
        {workflowSteps.map((step, index) => (
          <motion.div
            key={step.id}
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <motion.div
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
                index === currentStep
                  ? 'glass-card scale-110 ring-2 ring-accent'
                  : 'glass bg-white/5'
              }`}
              animate={index === currentStep ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {step.icon}
            </motion.div>
            <span className="text-xs mt-2 text-center text-muted-foreground font-medium max-w-16">
              {step.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Active agent display */}
      {activeAgent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card text-center"
        >
          <p className="text-xs text-muted-foreground mb-3">Active Agent</p>
          <div className="flex items-center justify-center gap-3">
            <motion.div
              className="text-4xl"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              {agentTypes.find(a => a.id === activeAgent)?.icon}
            </motion.div>
            <div>
              <p className="font-semibold text-foreground">
                {agentTypes.find(a => a.id === activeAgent)?.name}
              </p>
              <p className="text-xs text-accent">Processing...</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Agent grid */}
      <div className="grid grid-cols-2 gap-3">
        {agentTypes.map((agent, index) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`glass-card text-center py-4 ${
              agent.id === activeAgent ? 'ring-2 ring-accent' : ''
            }`}
          >
            <div className="text-3xl mb-2">{agent.icon}</div>
            <p className="text-xs font-medium text-foreground">{agent.name}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <motion.div className="w-full h-1 bg-white/5 rounded-full overflow-hidden glass">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent"
          animate={{ width: ['0%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.div>
    </div>
  )
}
