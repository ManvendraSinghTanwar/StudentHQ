'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { QuickActionButton } from '@/components/quick-actions/QuickActionButton'
import { GlassmorphismCard } from '@/components/cards/GlassmorphismCard'
import { AppProvider, useApp } from '@/contexts/AppContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import {
  preloadEngine,
  subscribeEngineState,
  getEngineState,
  routeContentLocally,
  type ContentIntent,
} from '@/lib/services/RouterService'
import { extractTextFromImage } from '@/lib/utils/ocr'

function intentToAgent(intent: ContentIntent) {
  if (intent === 'assignment' || intent === 'notes') return 'study'
  if (intent === 'receipt') return 'expense'
  if (intent === 'job_post' || intent === 'event') return 'schedule'
  if (intent === 'mess_menu') return 'health'
  return 'router'
}

// TODO: replace with the authenticated user's id once auth is wired in
const STUDENT_ID = 'student_002'

type RoutingResult = {
  intent: ContentIntent
  confidence: number
  recommendedAgents: string[]
  processedLocally: boolean
}

// Forward the captured input + detected intent to n8n via /api/ingest.
// Fire-and-forget: n8n processes asynchronously and posts the result back to
// /api/agent-result, which the Results page reads from Supabase.
async function sendToIngest(args: {
  text: string
  source: 'document' | 'camera' | 'voice'
  routing: RoutingResult
  file?: { name: string; type: string; size: number }
}) {
  const { text, source, routing, file } = args
  try {
    const res = await fetch('/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: STUDENT_ID,
        source,
        text,
        raw_text: text,
        intent: routing.intent,
        confidence: routing.confidence,
        recommendedAgents: routing.recommendedAgents,
        processedLocally: routing.processedLocally,
        file,
        timestamp: new Date().toISOString(),
      }),
    })
    if (!res.ok) {
      console.error('[v0] Ingest forward failed:', res.status, await res.text())
    }
  } catch (error) {
    console.error('[v0] Ingest forward error:', error)
  }
}

function HomeContent() {
  const router = useRouter()
  const { setProcessingState, setActiveAgent } = useApp()
  const { showPrompt, handleInstall, handleDismiss } = useInstallPrompt()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const cameraVideoRef = useRef<HTMLVideoElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const speechRecognitionRef = useRef<any>(null)

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        // Use getSession for better compatibility with Supabase auth
        const { data: { session } } = await supabase.auth.getSession()
        
        // For hackathon demo: allow access even without auth
        // In production, redirect to login if no session
        if (session) {
          setIsAuthenticated(true)
        } else {
          // Demo mode: show warning but allow access
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('[v0] Auth check error:', error)
        // Demo mode: still allow access
        setIsAuthenticated(true)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Show setup UI if not initialized
    try {
      const ready = localStorage.getItem('llm_ready') === 'true'
      const skipped = localStorage.getItem('llm_skip') === 'true'
      if (!ready && !skipped) {
        // we don't auto-start; show UI and let user trigger, but warm in background optionally
        // preloadEngine() // keep commented - user should choose to start setup
      }
    } catch (e) {
      // ignore storage errors
    }

  }, [router])

  const openDocumentPicker = () => {
    documentInputRef.current?.click()
  }

  const stopCameraStream = () => {
    cameraStreamRef.current?.getTracks().forEach(track => track.stop())
    cameraStreamRef.current = null
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null
    }
  }

  const openCameraPicker = () => {
    setCameraError(null)
    setIsCameraOpen(true)
  }

  useEffect(() => {
    const startCamera = async () => {
      if (!isCameraOpen) {
        stopCameraStream()
        return
      }

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera is not supported in this browser.')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })

        cameraStreamRef.current = stream
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream
          await cameraVideoRef.current.play()
        }
      } catch (error) {
        console.error('[v0] Camera open failed:', error)
        setCameraError('Unable to access the camera. Please allow camera permissions.')
        setIsCameraOpen(false)
      }
    }

    startCamera()

    return () => {
      stopCameraStream()
    }
  }, [isCameraOpen])

  const analyzeAndRoute = async (
    file: File,
    source: 'document' | 'camera' | 'voice',
  ) => {
    const uploadPayload: Record<string, any> = {
      name: file.name,
      type: file.type,
      size: file.size,
      source,
    }

    let analysisContent = `Filename: ${file.name}\nType: ${file.type || 'unknown'}\nSize: ${file.size} bytes`

    if (file.type.startsWith('image/')) {
      try {
        const extractedText = await extractTextFromImage(file)
        if (extractedText) {
          uploadPayload.extractedText = extractedText
          analysisContent += `\n\nExtracted text:\n${extractedText}`
        }
      } catch (error) {
        console.debug('[v0] OCR extraction skipped:', error)
      }
    } else if (file.type.startsWith('text/') || /\.(txt|md|csv|json|rtf)$/i.test(file.name)) {
      try {
        const textContent = await file.text()
        if (textContent.trim()) {
          uploadPayload.extractedText = textContent.trim()
          analysisContent += `\n\nFile text:\n${textContent.slice(0, 4000)}`
        }
      } catch (error) {
        console.debug('[v0] Text extraction skipped:', error)
      }
    }

    const routingResult = await routeContentLocally(analysisContent)
    uploadPayload.analysis = routingResult
    sessionStorage.setItem('studentos.uploadedFile', JSON.stringify(uploadPayload))
    sessionStorage.setItem('studentos.routingResult', JSON.stringify(routingResult))

    // Forward the captured input + intent to n8n (async, result comes back via
    // /api/agent-result → Supabase → Results page)
    void sendToIngest({
      text: uploadPayload.extractedText ?? analysisContent,
      source,
      routing: routingResult,
      file: { name: file.name, type: file.type, size: file.size },
    })

    setProcessingState('processing')
    setActiveAgent(intentToAgent(routingResult.intent))
    router.push('/processing')
  }

  const handleDocumentChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    try {
      await analyzeAndRoute(file, 'document')
    } catch (error) {
      console.error('[v0] Document analysis failed:', error)
      event.target.value = ''
    }
  }

  const handleCameraChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      await analyzeAndRoute(file, 'camera')
    } catch (error) {
      console.error('[v0] Camera analysis failed:', error)
      event.target.value = ''
    }
  }

  const startVoiceInput = async () => {
    if (isListening) {
      speechRecognitionRef.current?.stop?.()
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    const speechWindow = window as Window & {
      SpeechRecognition?: any
      webkitSpeechRecognition?: any
    }
    const SpeechRecognitionCtor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition

    if (!SpeechRecognitionCtor) {
      setVoiceStatus('Speech-to-text is not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognitionCtor()
    speechRecognitionRef.current = recognition

    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false

    let transcript = ''

    setIsListening(true)
    setVoiceStatus('Listening...')

    recognition.onresult = (event: any) => {
      transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript ?? '')
        .join('')

      if (event.results?.[event.results.length - 1]?.isFinal) {
        recognition.stop()
      }
    }

    recognition.onerror = (event: any) => {
      console.error('[v0] Speech recognition error:', event?.error || event)
      setIsListening(false)
      setVoiceStatus('Voice input failed. Try again.')
    }

    recognition.onend = async () => {
      setIsListening(false)
      const finalTranscript = transcript.trim()

      if (!finalTranscript) {
        setVoiceStatus('No speech detected.')
        return
      }

      setVoiceStatus('Analyzing voice note...')

      try {
        const routingResult = await routeContentLocally(finalTranscript)
        sessionStorage.setItem(
          'studentos.uploadedFile',
          JSON.stringify({
            name: 'voice-note.txt',
            type: 'text/plain',
            size: finalTranscript.length,
            source: 'voice',
            extractedText: finalTranscript,
            analysis: routingResult,
          }),
        )
        sessionStorage.setItem('studentos.routingResult', JSON.stringify(routingResult))

        // Forward the spoken text + intent to n8n
        void sendToIngest({
          text: finalTranscript,
          source: 'voice',
          routing: routingResult,
          file: { name: 'voice-note.txt', type: 'text/plain', size: finalTranscript.length },
        })

        setProcessingState('processing')
        setActiveAgent(intentToAgent(routingResult.intent))
        router.push('/processing')
      } catch (error) {
        console.error('[v0] Voice analysis failed:', error)
        setVoiceStatus('Voice analysis failed.')
      }
    }

    recognition.start()
  }

  const captureCameraPhoto = async () => {
    const video = cameraVideoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError('Camera is not ready yet.')
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext('2d')
    if (!context) {
      setCameraError('Unable to capture the photo.')
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    })

    if (!blob) {
      setCameraError('Unable to capture the photo.')
      return
    }

    const photoFile = new File([blob], `camera-photo-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    })

    setIsCameraOpen(false)
    stopCameraStream()

    try {
      await analyzeAndRoute(photoFile, 'camera')
    } catch (error) {
      console.error('[v0] Camera analysis failed:', error)
    }
  }

  const quickActions = [
    {
      icon: '📄',
      label: 'Upload Document',
      action: openDocumentPicker,
    },
    {
      icon: '📷',
      label: 'Take Photo',
      action: openCameraPicker,
    },
    {
      icon: '🎤',
      label: isListening ? 'Listening...' : 'Voice',
      action: startVoiceInput,
    },
  ]

  // LLM setup UI state
  const [llmSetupVisible, setLlmSetupVisible] = useState(() => {
    try {
      return localStorage.getItem('llm_ready') !== 'true' && localStorage.getItem('llm_skip') !== 'true'
    } catch (e) {
      return true
    }
  })
  const [llmProgress, setLlmProgress] = useState(0)
  const [llmStatus, setLlmStatus] = useState<'idle' | 'downloading' | 'ready' | 'failed'>('idle')
  const [llmError, setLlmError] = useState<string | null>(null)
  const [llmStatusText, setLlmStatusText] = useState<string>('')
  useEffect(() => {
    if (!llmSetupVisible) return
    // subscribe to engine progress updates
    const current = getEngineState()
    setLlmProgress(current.progress || 0)
    setLlmStatus(current.state === 'ready' ? 'ready' : current.state === 'failed' ? 'failed' : current.state === 'downloading' ? 'downloading' : 'idle')
    setLlmError(current.error ?? null)
    setLlmStatusText(current.status ?? '')
    const unsub = subscribeEngineState(s => {
      setLlmProgress(s.progress || 0)
      setLlmStatus(s.state === 'ready' ? 'ready' : s.state === 'failed' ? 'failed' : s.state === 'downloading' ? 'downloading' : 'idle')
      setLlmError(s.error ?? null)
      setLlmStatusText(s.status ?? '')
      if (s.state === 'ready') {
        setTimeout(() => setLlmSetupVisible(false), 800)
      }
    })
    return () => { unsub() }
  }, [llmSetupVisible])

  const startLLMSetup = () => {
    try {
      localStorage.removeItem('llm_skip')
    } catch (e) {}
    preloadEngine()
    setLlmSetupVisible(true)
  }

  const skipLLMSetup = () => {
    try {
      localStorage.setItem('llm_skip', 'true')
    } catch (e) {}
    setLlmSetupVisible(false)
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.10), hsl(var(--background)))' }}
      >
        <div className="text-center space-y-4">
          <div className="inline-block">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          </div>
          <p className="text-muted-foreground">Loading StudentOS...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Router will handle redirect
  }

  return (
    <div
      className="min-h-screen pb-32 pt-8 px-4"
      style={{ background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.10), hsl(var(--background)))' }}
    >
      <div className="max-w-2xl mx-auto space-y-8">
        {/* LLM Setup onboarding */}
        {llmSetupVisible && (
          <div
            className="glass-card p-4 border-accent/50 relative z-20 pointer-events-auto select-none"
            onDoubleClick={startLLMSetup}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Setup offline AI</p>
                <p className="text-xs text-muted-foreground">
                  {llmStatus === 'ready'
                    ? 'Offline AI is ready'
                    : llmStatus === 'failed'
                      ? 'Setup failed, you can try again'
                      : llmStatus === 'downloading'
                        ? 'Downloading and optimizing model for on-device routing'
                        : 'Download and optimize model for on-device routing'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={skipLLMSetup}
                  className="px-3 py-2 rounded bg-white/5 text-xs cursor-pointer pointer-events-auto active:scale-95 transition-transform"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={startLLMSetup}
                  className="px-3 py-2 rounded bg-accent text-xs text-background cursor-pointer pointer-events-auto active:scale-95 transition-transform"
                >
                  Start
                </button>
              </div>
            </div>

            <div className="mt-3">
              <div className="w-full bg-white/5 rounded h-2 overflow-hidden">
                {llmStatus === 'downloading' && llmProgress <= 0 ? (
                  // Indeterminate bar — model is preparing (runtime load / shader
                  // compile) before any percentage is reported.
                  <div className="h-2 w-1/3 bg-accent rounded animate-pulse" />
                ) : (
                  <div className="bg-accent h-2 transition-all" style={{ width: `${llmProgress}%` }} />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {llmStatus === 'ready'
                  ? 'Ready'
                  : llmStatus === 'failed'
                    ? 'Failed'
                    : llmProgress > 0
                      ? `Progress: ${Math.round(llmProgress)}%`
                      : llmStatusText || 'Preparing…'}
              </p>
              {llmStatus === 'failed' && llmError && (
                <p className="text-xs text-destructive mt-1">
                  {llmError === 'offline'
                    ? 'You appear to be offline. Connect to the internet to download the model.'
                    : llmError}
                </p>
              )}
            </div>
          </div>
        )}
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl font-bold text-foreground text-balance">
            Your AI Staff
          </h1>
          <p className="text-muted-foreground">
            Upload a document, take a photo, or speak to analyze content locally
          </p>
        </motion.div>

        {/* Install Prompt */}
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card text-center border-accent/50"
          >
            <p className="mb-3 text-sm">Install StudentOS for quick access</p>
            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors"
              >
                Not now
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 px-3 py-2 rounded-lg bg-accent text-background text-xs font-medium transition-colors"
              >
                Install
              </button>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground px-2">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickActions.map((action, index) => (
              <QuickActionButton
                key={index}
                icon={action.icon}
                label={action.label}
                onClick={action.action}
                delay={index * 0.1}
              />
            ))}
          </div>
          {voiceStatus && (
            <p className="px-2 text-xs text-muted-foreground">{voiceStatus}</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground px-2">Recent Activity</h2>
          {[
            { emoji: '📚', text: 'Analyzed study notes for Chapter 5', time: '2 hours ago' },
            { emoji: '💰', text: 'Processed expense receipt from cafe', time: '5 hours ago' },
            { emoji: '📅', text: 'Generated study schedule for exam', time: 'Yesterday' },
          ].map((item, index) => (
            <GlassmorphismCard key={index} delay={index * 0.1}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground text-balance">
                    {item.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                </div>
              </div>
            </GlassmorphismCard>
          ))}
        </div>

        {/* CTA Card */}
        <GlassmorphismCard className="text-center border-accent/50">
          <div className="space-y-3">
            <div className="text-4xl">✨</div>
            <h3 className="text-lg font-bold text-foreground">Let AI Handle It</h3>
            <p className="text-sm text-muted-foreground">
              Your personal AI staff available 24/7 to help with your studies, schedule, and daily tasks
            </p>
            <button
              onClick={() => {
                setProcessingState('processing')
                setActiveAgent('router')
                router.push('/processing')
              }}
              className="w-full glass-button bg-primary text-primary-foreground hover:bg-primary/80 mt-2"
            >
              Start Processing
            </button>
          </div>
        </GlassmorphismCard>
      </div>

      <input
        ref={documentInputRef}
        type="file"
        accept="image/*,.pdf,.txt,.md,.csv,.json,.rtf,.doc,.docx"
        className="hidden"
        onChange={handleDocumentChange}
      />
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
          <div className="w-full max-w-lg space-y-4 rounded-3xl border border-white/10 bg-zinc-950 p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Take Photo</p>
                <p className="text-xs text-white/60">Capture with your camera and analyze locally</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCameraOpen(false)
                  stopCameraStream()
                }}
                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white"
              >
                Close
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl bg-black">
              <video
                ref={cameraVideoRef}
                autoPlay
                playsInline
                muted
                className="h-105 w-full object-cover"
              />
            </div>

            {cameraError && <p className="text-xs text-red-300">{cameraError}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={captureCameraPhoto}
                className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-background"
              >
                Capture Photo
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCameraOpen(false)
                  stopCameraStream()
                }}
                className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  )
}

export default function Page() {
  return (
    <AppProvider>
      <NotificationProvider>
        <HomeContent />
      </NotificationProvider>
    </AppProvider>
  )
}
