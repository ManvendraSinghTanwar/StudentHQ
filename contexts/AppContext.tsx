'use client'

import React, { createContext, useContext, useState } from 'react'

export type ProcessingState = 'idle' | 'processing' | 'complete'

export interface ProcessingResult {
  type: 'assignment' | 'notes' | 'receipt' | 'job' | 'menu'
  data: Record<string, any>
}

interface AppContextType {
  currentPage: string
  setCurrentPage: (page: string) => void
  processingState: ProcessingState
  setProcessingState: (state: ProcessingState) => void
  activeAgent: string | null
  setActiveAgent: (agent: string | null) => void
  processingResult: ProcessingResult | null
  setProcessingResult: (result: ProcessingResult | null) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState('home')
  const [processingState, setProcessingState] = useState<ProcessingState>('idle')
  const [activeAgent, setActiveAgent] = useState<string | null>(null)
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        processingState,
        setProcessingState,
        activeAgent,
        setActiveAgent,
        processingResult,
        setProcessingResult,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
