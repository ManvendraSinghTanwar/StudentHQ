'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

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

function readSessionValue<T>(key: string, fallback: T, parser: (value: string) => T) {
  if (typeof window === 'undefined') return fallback

  try {
    const value = sessionStorage.getItem(key)
    return value ? parser(value) : fallback
  } catch {
    return fallback
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState('home')
  const [processingState, setProcessingState] = useState<ProcessingState>(() =>
    readSessionValue<ProcessingState>('studentos.processingState', 'idle', value =>
      value === 'processing' || value === 'complete' ? value : 'idle'
    )
  )
  const [activeAgent, setActiveAgent] = useState<string | null>(() =>
    readSessionValue<string | null>('studentos.activeAgent', null, value => value)
  )
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(() =>
    readSessionValue<ProcessingResult | null>('studentos.processingResult', null, value => {
      try {
        return JSON.parse(value) as ProcessingResult
      } catch {
        return null
      }
    })
  )

  useEffect(() => {
    try {
      sessionStorage.setItem('studentos.processingState', processingState)
    } catch {}
  }, [processingState])

  useEffect(() => {
    try {
      if (activeAgent) {
        sessionStorage.setItem('studentos.activeAgent', activeAgent)
      } else {
        sessionStorage.removeItem('studentos.activeAgent')
      }
    } catch {}
  }, [activeAgent])

  useEffect(() => {
    try {
      if (processingResult) {
        sessionStorage.setItem('studentos.processingResult', JSON.stringify(processingResult))
      } else {
        sessionStorage.removeItem('studentos.processingResult')
      }
    } catch {}
  }, [processingResult])

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
