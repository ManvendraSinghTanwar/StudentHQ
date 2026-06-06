'use client'

import { motion } from 'framer-motion'

interface PremiumLoaderProps {
  text?: string
}

export function PremiumLoader({ text = 'Processing...' }: PremiumLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      {/* Animated circles */}
      <div className="relative w-24 h-24">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent border-r-primary"
            animate={{ rotate: 360 }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ⚙️
          </motion.div>
        </div>
      </div>

      {/* Text */}
      <div className="text-center">
        <p className="text-foreground font-medium">{text}</p>
        <motion.p
          className="text-sm text-muted-foreground mt-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          AI agents working on your request...
        </motion.p>
      </div>

      {/* Pulse effect */}
      <motion.div
        className="w-32 h-1 bg-gradient-to-r from-primary via-accent to-primary rounded-full blur-sm"
        animate={{
          opacity: [0.3, 0.8, 0.3],
          width: ['80px', '128px', '80px'],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  )
}
