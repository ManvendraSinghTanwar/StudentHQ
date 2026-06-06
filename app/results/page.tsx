'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { ResultCard } from '@/components/results/ResultCard'
import { AppProvider } from '@/contexts/AppContext'
import { NotificationProvider } from '@/contexts/NotificationContext'

const resultIcons: Record<string, string> = {
  assignment: '📚',
  notes: '📝',
  receipt: '🧾',
  job: '💼',
  menu: '🍽️',
}

// A row from the Supabase `processing_results` table
interface ProcessingResultRow {
  id: string
  user_id: string
  result_type: string
  result_data: {
    type?: string
    data?: Record<string, any>
    actions?: string[]
  } | null
  agent_type: string | null
  status: string | null
  created_at: string
}

// Normalize a stored row into { type, data, actions } regardless of how it was saved
function normalizeRow(row: ProcessingResultRow) {
  const rd = row.result_data ?? {}
  const type = (rd.type ?? row.result_type ?? 'general').toLowerCase()
  const data = (rd.data ?? rd ?? {}) as Record<string, any>
  const actions = rd.actions ?? []
  return { type, data, actions }
}

function AssignmentResult({ data, actions }: { data: Record<string, any>; actions: string[] }) {
  const tasks: string[] = data.tasks ?? data.studyPlan ?? []
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {data.subject && (
          <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">{data.subject}</span>
        )}
        {data.priority && (
          <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">{data.priority} priority</span>
        )}
        {data.estimated_hours != null && (
          <span className="px-2 py-1 bg-white/10 text-foreground text-xs rounded">
            ~{data.estimated_hours}h
          </span>
        )}
      </div>

      {data.deadline && (
        <div className="mt-4 p-3 bg-accent/20 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Deadline</p>
          <p className="font-bold text-accent">{data.deadline}</p>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-foreground mb-3">Tasks</p>
          <ol className="space-y-2">
            {tasks.map((step, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-2">
                <span className="flex-shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((a, i) => (
            <span key={i} className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
              ✓ {a.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {data.raw_text && (
        <p className="mt-4 text-xs text-muted-foreground italic">“{data.raw_text}”</p>
      )}
    </>
  )
}

function GenericResult({ data }: { data: Record<string, any> }) {
  return (
    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

function ResultsContent() {
  const [results, setResults] = useState<ProcessingResultRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await fetch('/api/agent-result?studentId=student_002', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        const json = await res.json()
        if (active) setResults(json.results ?? [])
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load results')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-background pb-32 pt-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Results</h1>
          <p className="text-muted-foreground text-sm mt-1">Your AI-processed insights</p>
        </motion.div>

        {loading && <p className="text-muted-foreground text-sm">Loading…</p>}

        {error && !loading && (
          <p className="text-sm text-red-400">Couldn’t load results: {error}</p>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-6">No results yet</p>
            <p className="text-sm text-muted-foreground">Process something to see results here</p>
          </div>
        )}

        {results.map((row, index) => {
          const { type, data, actions } = normalizeRow(row)
          const icon = resultIcons[type] ?? '✨'
          const title =
            data.title ?? data.position ?? data.merchant ?? data.todaysMeal ?? row.result_type
          return (
            <ResultCard key={row.id} title={title} icon={icon} delay={0.05 * index}>
              {type === 'assignment' ? (
                <AssignmentResult data={data} actions={actions} />
              ) : (
                <GenericResult data={data} />
              )}
              <p className="mt-4 text-[10px] text-muted-foreground">
                via {row.agent_type ?? 'agent'} · {new Date(row.created_at).toLocaleString()}
              </p>
            </ResultCard>
          )
        })}
      </div>

      <BottomNavigation />
    </div>
  )
}

export default function ResultsPage() {
  return (
    <AppProvider>
      <NotificationProvider>
        <ResultsContent />
      </NotificationProvider>
    </AppProvider>
  )
}
