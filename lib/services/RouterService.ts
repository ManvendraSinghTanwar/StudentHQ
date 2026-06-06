'use client'

export type ContentIntent =
  | 'assignment'
  | 'notes'
  | 'receipt'
  | 'job_post'
  | 'event'
  | 'mess_menu'
  | 'general'

export interface RouterResult {
  intent: ContentIntent
  confidence: number
  desc: string
  recommendedAgents: string[]
  processedLocally: boolean
  error?: string
}

const intentPrompt = `Classify the following content into ONE of these categories:
- assignment: School or university assignments
- notes: Study notes or lecture notes
- receipt: Expense receipts or invoices
- job_post: Job postings or career opportunities
- event: Events, meetings, or calendar items
- mess_menu: Food menu or meal information
- general: Other content

Content:
{content}

Return ONLY JSON:
{"intent":"assignment","confidence":0.95, "desc": "explain what the content is about in one sentence."}`

const recommendedAgentMap: Record<ContentIntent, string[]> = {
  assignment: ['study', 'schedule'],
  notes: ['study', 'schedule'],
  receipt: ['expense'],
  job_post: ['schedule'],
  event: ['schedule'],
  mess_menu: ['health'],
  general: ['content'],
}

const desktopModel = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'
const mobileModel = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'

// ---------------- DEVICE DETECTION ----------------

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  const nav = navigator as Navigator & { deviceMemory?: number }

  const isMobileUA =
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

  const lowMemory =
    typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4

  const lowCPU =
    typeof navigator.hardwareConcurrency === 'number' &&
    navigator.hardwareConcurrency <= 4

  return isMobileUA || lowMemory || lowCPU
}

// ---------------- ENGINE STATE ----------------

let engine: any | null = null
let engineLoading = false
let engineError: string | null = null

export type EngineState =
  | 'not_started'
  | 'downloading'
  | 'ready'
  | 'failed'

let engineState: EngineState = 'not_started'
let engineProgress = 0

type Subscriber = (s: {
  state: EngineState
  progress: number
  error?: string | null
}) => void

const subscribers = new Set<Subscriber>()

function notify() {
  const snapshot = {
    state: engineState,
    progress: engineProgress,
    error: engineError,
  }

  subscribers.forEach(cb => {
    try {
      cb(snapshot)
    } catch {}
  })
}

export function subscribeEngineState(cb: Subscriber) {
  subscribers.add(cb)
  cb({ state: engineState, progress: engineProgress, error: engineError })
  return () => subscribers.delete(cb)
}

export function getEngineState() {
  return { state: engineState, progress: engineProgress, error: engineError }
}

// ✅ FIX: SSR-safe localStorage access
export function isEngineReady() {
  if (typeof window === 'undefined') return false

  try {
    return (
      engineState === 'ready' ||
      localStorage.getItem('llm_ready') === 'true'
    )
  } catch {
    return engineState === 'ready'
  }
}

// ---------------- INIT ----------------

function getModelName() {
  return isMobileDevice() ? mobileModel : desktopModel
}

function getInitTimeoutMs() {
  return isMobileDevice() ? 15000 : 8000
}

// ---------------- ENGINE INIT ----------------

async function initializeEngine(): Promise<boolean> {
  if (engine) return true

  if (engineLoading) {
    return new Promise(resolve => {
      const timeout = setTimeout(
        () => resolve(false),
        getInitTimeoutMs()
      )

      const interval = setInterval(() => {
        if (engine) {
          clearTimeout(timeout)
          clearInterval(interval)
          resolve(true)
        }
        if (engineError) {
          clearTimeout(timeout)
          clearInterval(interval)
          resolve(false)
        }
      }, 150)
    })
  }

  engineLoading = true
  engineError = null
  engineState = 'downloading'
  engineProgress = 0
  notify()

  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('offline')
    }

    const webllm = await import('@mlc-ai/web-llm')
    const { CreateMLCEngine, prebuiltAppConfig } = webllm

    let modelName = getModelName()

    const modelList: any[] = prebuiltAppConfig?.model_list || []

    const availableModels = Array.isArray(modelList)
      ? modelList
          .map(m =>
            typeof m === 'string'
              ? m
              : m?.model_id || m?.model
          )
          .filter(Boolean)
      : []

    if (
      availableModels.length &&
      !availableModels.includes(modelName)
    ) {
      modelName = availableModels[0]
    }

    const extractProgress = (info: any) => {
      // WebLLM FIX: no .percent guaranteed
      if (typeof info?.progress === 'number') {
        return info.progress <= 1
          ? info.progress * 100
          : info.progress
      }

      if (typeof info?.text === 'string') {
        const m = info.text.match(/(\d{1,3})%/)
        if (m) return Number(m[1])
      }

      return null
    }

    engine = await CreateMLCEngine(modelName, {
      initProgressCallback: (info: any) => {
        const p = extractProgress(info)
        if (p !== null) {
          engineProgress = Math.max(0, Math.min(100, p))
        }
        notify()
      },
    })

    engineState = 'ready'
    engineProgress = 100

    if (typeof window !== 'undefined') {
      localStorage.setItem('llm_ready', 'true')
      localStorage.removeItem('llm_skip')
    }

    engineLoading = false
    notify()

    return true
  } catch (err) {
    engineState = 'failed'
    engineError =
      err instanceof Error ? err.message : 'unknown error'

    engineLoading = false
    notify()

    console.error('[router] init failed:', engineError)

    return false
  }
}

// ---------------- ROUTING ----------------

export async function routeContentLocally(
  content: string
): Promise<RouterResult> {
  try {
    const ok = await initializeEngine()

    if (!ok || !engine) {
      return routeContentCloud(content)
    }

    const prompt = intentPrompt.replace(
      '{content}',
      content.slice(0, 500)
    )

    const response = await engine.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: isMobileDevice() ? 120 : 200,
    top_p: 0.9,
  })

  const text = response?.choices?.[0]?.message?.content ?? ''

  const match = text.match(/\{[\s\S]*\}/)

  if (!match) throw new Error('invalid output')

  let parsed: any

  try {
    parsed = JSON.parse(match[0])
  } catch {
    parsed = { intent: 'general', confidence: 0.5 }
  }

    const intent: ContentIntent =
      parsed.intent ?? 'general'

    return {
      intent,
      confidence: Number(parsed.confidence ?? 0.7),
      desc: String(parsed.desc ?? ''),
      recommendedAgents:
        recommendedAgentMap[intent] ?? ['content'],
      processedLocally: true,
    }
  } catch (err) {
    console.warn('[router] local fallback', err)
    return routeContentCloud(content)
  }
}

// ---------------- CLOUD FALLBACK ----------------

export async function routeContentCloud(
  content: string
): Promise<RouterResult> {
  try {
    const res = await fetch('/api/router', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.slice(0, 500) }),
    })

    if (!res.ok) throw new Error(`cloud error ${res.status}`)

    const data = await res.json()

    return {
      ...data,
      processedLocally: false,
    }
  } catch (err) {
    return {
      intent: 'general',
      confidence: 0.5,
      desc: '',
      recommendedAgents: ['content'],
      processedLocally: false,
      error:
        err instanceof Error ? err.message : 'unknown error',
    }
  }
}

// ---------------- UTILS ----------------

export function unloadEngine() {
  engine = null
  engineLoading = false
  engineError = null
  engineState = 'not_started'
  engineProgress = 0
  notify()
}

export function preloadEngine() {
  if (engine || engineLoading) return
  initializeEngine().catch(() => {})
}