'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface RouterFlowStep {
  id: string
  label: string
  icon: string
  completed: boolean
  active: boolean
}

export interface RouterFlowProps {
  intent?: string
  processedLocally?: boolean
  recommendedAgents?: string[]
}

const getInitialSteps = (): RouterFlowStep[] => [
  { id: 'upload', label: 'Upload Received', icon: '📥', completed: false, active: true },
  { id: 'router', label: 'On-Device Router', icon: '🔀', completed: false, active: false },
  { id: 'intent', label: 'Intent Detected', icon: '🎯', completed: false, active: false },
  { id: 'agents', label: 'Agents Selected', icon: '🤖', completed: false, active: false },
  { id: 'processing', label: 'Processing', icon: '⚙️', completed: false, active: false },
]

export function RouterFlow({ intent, processedLocally, recommendedAgents }: RouterFlowProps) {
  const [steps, setSteps] = useState<RouterFlowStep[]>(getInitialSteps())
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Advance through steps automatically
  useEffect(() => {
    const timer = setTimeout(() => {
      setSteps(prev => {
        const updated = [...prev]
        if (currentStepIndex > 0 && currentStepIndex - 1 < updated.length) {
          updated[currentStepIndex - 1].completed = true
          updated[currentStepIndex - 1].active = false
        }
        if (currentStepIndex < updated.length) {
          updated[currentStepIndex].active = true
        }
        return updated
      })
      setCurrentStepIndex(prev => (prev < steps.length ? prev + 1 : prev))
    }, 600)

    return () => clearTimeout(timer)
  }, [currentStepIndex, steps.length])

  return (
    <div className="w-full space-y-6">
      {/* Vertical flow diagram */}
      <div className="space-y-3 px-2">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2"
          >
            {/* Step circle and label */}
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <motion.div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                    step.completed
                      ? 'bg-accent text-background scale-110'
                      : step.active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}
                  animate={
                    step.active
                      ? { scale: [1, 1.1, 1], boxShadow: '0 0 0 8px rgba(170, 100, 255, 0.2)' }
                      : {}
                  }
                  transition={{ duration: 2, repeat: step.active ? Infinity : 0 }}
                >
                  {step.icon}
                </motion.div>
                {index < steps.length - 1 && (
                  <motion.div
                    className="w-1 h-12 bg-gradient-to-b from-muted-foreground to-transparent"
                    initial={{ scaleY: 0 }}
                    animate={step.completed ? { scaleY: 1 } : {}}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>

              {/* Step details */}
              <div className="flex-1 pt-1">
                <p
                  className={`text-sm font-medium ${
                    step.active ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Results card - only show when intent is detected */}
      {intent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card space-y-4"
        >
          {/* Intent badge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Detected Intent
              </p>
              {processedLocally && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full font-medium"
                >
                  Processed Locally
                </motion.span>
              )}
            </div>
            <p className="text-2xl font-bold text-accent capitalize">{intent}</p>
          </div>

          {/* Recommended agents */}
          {recommendedAgents && recommendedAgents.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Recommended Agents
              </p>
              <div className="flex flex-wrap gap-2">
                {recommendedAgents.map((agent, index) => (
                  <motion.div
                    key={agent}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium capitalize"
                  >
                    {agent}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Processing indicator */}
          <div className="pt-2 border-t border-white/10">
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Currently processing...
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
