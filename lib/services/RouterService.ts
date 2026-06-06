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

// Small, fast classifier models. We pick the quantization at runtime based on
// whether the GPU advertises the `shader-f16` feature:
//   - q4f16_1: smaller + faster, but REQUIRES the shader-f16 GPU feature
//   - q4f32_1: larger, but works on GPUs without shader-f16 (most phones)
const MODELS = {
  // 0.5B — light enough for phones / low-memory devices
  mobile: {
    f16: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    f32: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC',
  },
  // 1B — better classification on capable desktops
  desktop: {
    f16: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    f32: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
  },
} as const

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

// ---------------- WEBGPU DETECTION ----------------

interface GPUSupport {
  supported: boolean
  shaderF16: boolean
  reason?: string
}

/**
 * WebLLM needs WebGPU. WebGPU is only exposed in a secure context
 * (HTTPS or localhost), so opening the app on a phone via plain
 * http://<lan-ip>:3000 will report it as unavailable.
 */
async function detectWebGPU(): Promise<GPUSupport> {
  const gpu =
    typeof navigator !== 'undefined'
      ? (navigator as any).gpu
      : undefined

  if (!gpu) {
    const insecure =
      typeof window !== 'undefined' && !window.isSecureContext
    return {
      supported: false,
      shaderF16: false,
      reason: insecure
        ? 'WebGPU needs a secure context (HTTPS or localhost). Open the app over HTTPS to enable on-device AI.'
        : 'WebGPU is not available in this browser.',
    }
  }

  try {
    const adapter = await gpu.requestAdapter()
    if (!adapter) {
      return {
        supported: false,
        shaderF16: false,
        reason: 'No WebGPU adapter found (GPU may be blocklisted or disabled).',
      }
    }
    const shaderF16 = adapter.features?.has?.('shader-f16') ?? false
    return { supported: true, shaderF16 }
  } catch (err) {
    return {
      supported: false,
      shaderF16: false,
      reason:
        err instanceof Error ? err.message : 'WebGPU adapter request failed.',
    }
  }
}

function pickModel(shaderF16: boolean): string {
  const variant = isMobileDevice() ? MODELS.mobile : MODELS.desktop
  return shaderF16 ? variant.f16 : variant.f32
}

// Transient GPU device failures (driver hiccups, device lost/removed) are
// often resolved by simply requesting a fresh device.
function isTransientGpuError(msg: string): boolean {
  return /DEVICE_REMOVED|device removed|device lost|requestDevice|Device failed at creation|command queue/i.test(
    msg
  )
}

// Turn raw WebLLM/WebGPU errors into something actionable for the user.
function friendlyInitError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (isTransientGpuError(msg)) {
    return 'Your GPU could not start WebGPU (it was reset by the driver). Try updating your graphics drivers, closing other GPU-heavy tabs/apps, then retry. Cloud routing will be used meanwhile.'
  }
  if (msg === 'offline') {
    return 'You appear to be offline. Connect to the internet to download the on-device model.'
  }
  return msg
}

// ---------------- ENGINE STATE ----------------

let engine: any | null = null
let engineLoading = false
let engineError: string | null = null
// A single in-flight initialization shared by every caller, so repeated /
// concurrent calls (preload + processing page + StrictMode double-render)
// await the SAME load instead of racing or timing out mid-download.
let initPromise: Promise<boolean> | null = null
let currentModel: string | null = null

export type EngineState =
  | 'not_started'
  | 'downloading'
  | 'ready'
  | 'failed'

let engineState: EngineState = 'not_started'
let engineProgress = 0
let engineStatus = ''

type EngineSnapshot = {
  state: EngineState
  progress: number
  error?: string | null
  status?: string
}

type Subscriber = (s: EngineSnapshot) => void

const subscribers = new Set<Subscriber>()

function snapshot(): EngineSnapshot {
  return {
    state: engineState,
    progress: engineProgress,
    error: engineError,
    status: engineStatus,
  }
}

function notify() {
  const s = snapshot()
  subscribers.forEach(cb => {
    try {
      cb(s)
    } catch {}
  })
}

export function subscribeEngineState(cb: Subscriber) {
  subscribers.add(cb)
  cb(snapshot())
  return () => subscribers.delete(cb)
}

export function getEngineState() {
  return snapshot()
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

// ---------------- ENGINE INIT ----------------

function initializeEngine(): Promise<boolean> {
  // Already loaded and usable.
  if (engine && engineState === 'ready') return Promise.resolve(true)
  // A load is already in progress — share it.
  if (initPromise) return initPromise

  initPromise = doInitializeEngine()
  // Allow retry after a failure, but keep the promise cached while a
  // successful engine stays loaded.
  initPromise.then(ok => {
    if (!ok) initPromise = null
  })
  return initPromise
}

async function doInitializeEngine(): Promise<boolean> {
  engineLoading = true
  engineError = null
  engineState = 'downloading'
  engineProgress = 0
  engineStatus = 'Checking device support…'
  notify()

  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('offline')
    }

    // Gate on WebGPU before downloading anything — this is the #1 reason
    // on-device routing silently falls back to the cloud.
    const gpu = await detectWebGPU()
    if (!gpu.supported) {
      throw new Error(gpu.reason ?? 'WebGPU unavailable')
    }
    console.log(
      `[router] WebGPU ready (shader-f16: ${gpu.shaderF16}, mobile: ${isMobileDevice()})`
    )

    engineStatus = 'Loading AI runtime…'
    notify()

    const webllm = await import('@mlc-ai/web-llm')
    const { CreateMLCEngine, prebuiltAppConfig } = webllm

    let modelName = pickModel(gpu.shaderF16)

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
      // Prefer a known small fallback over the (possibly huge) first entry.
      const fallbacks = [
        MODELS.mobile.f32,
        MODELS.mobile.f16,
        gpu.shaderF16 ? MODELS.desktop.f16 : MODELS.desktop.f32,
      ]
      modelName =
        fallbacks.find(m => availableModels.includes(m)) ?? availableModels[0]
    }

    console.log('[router] loading model:', modelName)

    engineStatus = 'Preparing model (this can take a moment on first run)…'
    notify()

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

    const initProgressCallback = (info: any) => {
      const p = extractProgress(info)
      if (p !== null) {
        engineProgress = Math.max(0, Math.min(100, p))
      }
      // Surface WebLLM's own status text (e.g. "Loading model from cache",
      // "Compiling shaders") so the UI shows activity before % moves.
      if (typeof info?.text === 'string' && info.text.trim()) {
        engineStatus = info.text.trim()
      }
      notify()
    }

    // The WebGPU device can transiently fail at creation on some Windows /
    // driver setups (DXGI_ERROR_DEVICE_REMOVED). Retry a couple of times with
    // a short backoff — it often succeeds on a fresh device request.
    const MAX_ATTEMPTS = 3
    let lastErr: unknown
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        engine = await CreateMLCEngine(modelName, { initProgressCallback })
        lastErr = undefined
        break
      } catch (err) {
        lastErr = err
        engine = null
        const msg = err instanceof Error ? err.message : String(err)
        const transient = isTransientGpuError(msg)
        console.warn(
          `[router] engine create attempt ${attempt}/${MAX_ATTEMPTS} failed${transient ? ' (transient GPU error)' : ''}:`,
          msg
        )
        if (!transient || attempt === MAX_ATTEMPTS) throw err
        engineStatus = 'GPU hiccup — retrying…'
        engineProgress = 0
        notify()
        await new Promise(r => setTimeout(r, 600 * attempt))
      }
    }
    if (lastErr) throw lastErr

    currentModel = modelName
    engineState = 'ready'
    engineProgress = 100
    engineStatus = 'Ready'

    if (typeof window !== 'undefined') {
      localStorage.setItem('llm_ready', 'true')
      localStorage.removeItem('llm_skip')
    }

    engineLoading = false
    notify()

    console.log('[router] model ready:', modelName)
    return true
  } catch (err) {
    // Leave no half-initialized engine behind — truthiness must mean "ready".
    engine = null
    currentModel = null
    engineState = 'failed'
    engineError = friendlyInitError(err)
    engineStatus = ''

    engineLoading = false
    notify()

    console.error('[router] init failed:', err)

    return false
  }
}

// ---------------- ROUTING ----------------

export async function routeContentLocally(
  content: string
): Promise<RouterResult> {
  // Only run on-device inference when the model is genuinely loaded.
  // If it isn't ready yet, warm it up in the background and serve the
  // (instant) cloud result now — this avoids the ModelNotLoadedError that
  // happened when inference was attempted mid-download, and avoids blocking
  // the UI for the minutes a first-time model download can take.
  if (!engine || engineState !== 'ready') {
    // Warm up once in the background. Don't auto-retry after a failure
    // (e.g. a GPU that keeps getting removed) — that would re-run the whole
    // failing init on every route. The user can retry from the setup card.
    if (engineState === 'not_started') preloadEngine()
    return routeContentCloud(content)
  }

  try {
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
    // If the model got unloaded (e.g. GPU device lost), reset so the next
    // call can cleanly re-initialize instead of repeatedly throwing.
    const msg = err instanceof Error ? `${err.name} ${err.message}` : String(err)
    if (/ModelNotLoaded|not loaded/i.test(msg)) {
      engine = null
      currentModel = null
      engineState = 'not_started'
      initPromise = null
    }
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
  currentModel = null
  initPromise = null
  engineLoading = false
  engineError = null
  engineState = 'not_started'
  engineProgress = 0
  engineStatus = ''
  notify()
}

export function preloadEngine() {
  // initializeEngine() is idempotent (shares one in-flight promise), so this
  // is safe to call repeatedly.
  if (engine && engineState === 'ready') return
  initializeEngine().catch(() => {})
}