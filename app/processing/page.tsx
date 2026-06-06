'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { RouterFlow } from '@/components/agents/RouterFlow'
import { PremiumLoader } from '@/components/loaders/PremiumLoader'
import { AppProvider, useApp } from '@/contexts/AppContext'
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext'
import { mockResultTypes } from '@/lib/mock-data'
import { routeContentLocally, type ContentIntent } from '@/lib/services/RouterService'

type PipelineStage = {
  label: string
  status: 'done' | 'active' | 'pending'
  detail: string
}

function ProcessingContent() {
  const router = useRouter()
  const { processingState, activeAgent, setProcessingState, setProcessingResult, setActiveAgent } =
    useApp()
  const { addNotification } = useNotifications()
  const [progress, setProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<{
    name: string
    type: string
    size: number
    agentType: string
    source: string
    extractedText?: string
  } | null>(null)
  const [routingResult, setRoutingResult] = useState<{
    intent: ContentIntent
    confidence: number
    recommendedAgents: string[]
    processedLocally: boolean
  } | null>(null)
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([
    { label: 'Input Captured', status: 'active', detail: 'Waiting for upload or voice input' },
    { label: 'OCR / Speech-to-Text', status: 'pending', detail: 'Extracting readable text' },
    { label: 'Local LLM Routing', status: 'pending', detail: 'Classifying content intent on-device' },
    { label: 'Agent Selection', status: 'pending', detail: 'Picking the best helper agent' },
    { label: 'Result Assembly', status: 'pending', detail: 'Preparing the final response' },
  ])

  useEffect(() => {
    try {
      const storedFile = sessionStorage.getItem('studentos.uploadedFile')
      if (storedFile) {
        const parsed = JSON.parse(storedFile)
        setUploadedFile(parsed)
        console.log('[v0] Loaded uploaded file from storage:', parsed)
      }
    } catch (error) {
      console.error('[v0] Failed to read uploaded file metadata:', error)
    }
  }, [])

  useEffect(() => {
    const extractedText = uploadedFile?.extractedText?.trim()
    const hasRouting = Boolean(routingResult)

    setPipelineStages([
      {
        label: 'Input Captured',
        status: 'done',
        detail: uploadedFile ? `${uploadedFile.name} received from ${uploadedFile.source}` : 'Waiting for input',
      },
      {
        label: 'OCR / Speech-to-Text',
        status: extractedText ? 'done' : uploadedFile ? 'active' : 'pending',
        detail: extractedText
          ? `Text extracted locally (${extractedText.length} characters)`
          : uploadedFile
            ? 'Scanning image or converting voice to text'
            : 'No OCR or speech output yet',
      },
      {
        label: 'Local LLM Routing',
        status: hasRouting ? 'done' : uploadedFile ? 'active' : 'pending',
        detail: hasRouting
          ? `Intent: ${routingResult?.intent ?? 'general'}${routingResult?.processedLocally ? ' (local)' : ''}`
          : 'Running on-device classification',
      },
      {
        label: 'Agent Selection',
        status: routingResult ? 'done' : 'pending',
        detail: routingResult
          ? `Recommended: ${routingResult.recommendedAgents.join(', ') || 'content'}`
          : 'Selecting the most relevant agent',
      },
      {
        label: 'Result Assembly',
        status: processingState === 'complete' ? 'done' : 'active',
        detail: processingState === 'complete' ? 'Results ready' : 'Building the final output',
      },
    ])
  }, [uploadedFile, routingResult, processingState])

  useEffect(() => {
    if (processingState === 'processing') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev
          return prev + Math.random() * 30
        })
      }, 500)

      // Route the content using cloud endpoint (WebLLM as fallback)
      const routeContent = async () => {
        try {
          let sampleContent: string
          
          if (uploadedFile?.extractedText) {
            // Use OCR-extracted text from image
            sampleContent = uploadedFile.extractedText
            console.log('[v0] Using OCR-extracted text for routing')
          } else if (uploadedFile) {
            // Fallback: use file metadata
            sampleContent = `${uploadedFile.source === 'laptop' ? 'Image uploaded from laptop' : 'Uploaded file'}: ${uploadedFile.name}. Type: ${uploadedFile.type || 'unknown'}. Size: ${uploadedFile.size} bytes.`
          } else {
            // Demo content
            sampleContent = 'Physics assignment about motion and forces. Due next Friday. Need to submit 5 pages with calculations and diagrams.'
          }
          
          // Use the local router result immediately, with WebLLM/cloud fallback handled inside the router
          const result = await routeContentLocally(sampleContent)
          setRoutingResult(result)
          sessionStorage.setItem('studentos.routingResult', JSON.stringify(result))
          console.log('[v0] Routing result:', result)
        } catch (err) {
          console.error('[v0] Routing failed:', err)
        }
      }

      // Start routing immediately
      routeContent()

      // Simulate completion after 5-6 seconds
      const timer = setTimeout(() => {
        setProgress(100)
        setProcessingState('complete')

        // Select result type based on routing or fallback to random
        let resultType: keyof typeof mockResultTypes
        if (routingResult?.intent === 'assignment') {
          resultType = 'assignment'
        } else if (routingResult?.intent === 'notes') {
          resultType = 'notes'
        } else if (routingResult?.intent === 'receipt') {
          resultType = 'receipt'
        } else if (routingResult?.intent === 'job_post') {
          resultType = 'job'
        } else if (routingResult?.intent === 'mess_menu') {
          resultType = 'menu'
        } else {
          const resultTypes = Object.keys(mockResultTypes) as Array<
            keyof typeof mockResultTypes
          >
          resultType = resultTypes[Math.floor(Math.random() * resultTypes.length)]
        }

        const resultData = mockResultTypes[resultType]

        setProcessingResult({
          type: resultType,
          data: resultData,
        })

        addNotification({
          title: 'Processing Complete',
          message: 'Your content has been analyzed. Check results!',
          type: 'success',
        })

        setTimeout(() => {
          router.push('/results')
        }, 1000)
      }, 6000)

      return () => {
        clearInterval(interval)
        clearTimeout(timer)
      }
    }
  }, [processingState, router, setProcessingState, setProcessingResult, addNotification, uploadedFile])

  return (
    <div className="min-h-screen bg-background pb-32 pt-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">AI Processing</h1>
          <p className="text-muted-foreground text-sm mt-1">Watch your request being processed</p>
        </motion.div>

        {/* Main Content */}
        {processingState === 'idle' ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-6">No active processing</p>
            {uploadedFile && (
              <p className="text-xs text-muted-foreground mb-4">
                Ready to process {uploadedFile.name}
              </p>
            )}
            <button
              onClick={() => {
                setProcessingState('processing')
                setActiveAgent('router')
              }}
              className="glass-button bg-primary text-primary-foreground"
            >
              Start Processing
            </button>
          </div>
        ) : processingState === 'processing' ? (
          <>
            {uploadedFile && (
              <div className="glass-card border-accent/40 text-sm text-muted-foreground">
                Processing uploaded file: <span className="text-foreground font-medium">{uploadedFile.name}</span>
              </div>
            )}

            {/* OCR / Speech Output */}
            {(uploadedFile?.extractedText || uploadedFile?.analysis) && (
              <div className="glass-card space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      OCR / Speech Output
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Local text extracted from the image, document, or voice input
                    </p>
                  </div>
                  {routingResult?.processedLocally && (
                    <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
                      Local AI
                    </span>
                  )}
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <pre className="whitespace-pre-wrap wrap-break-word text-xs leading-6 text-muted-foreground max-h-56 overflow-auto">
                    {uploadedFile.extractedText || JSON.stringify(uploadedFile.analysis, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Local LLM Pipeline */}
            <div className="glass-card space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Local LLM Pipeline
                </p>
                <p className="text-sm text-muted-foreground">
                  OCR, speech-to-text, and on-device routing stages
                </p>
              </div>
              <div className="space-y-3">
                {pipelineStages.map((stage, index) => (
                  <div key={stage.label} className="flex items-start gap-3">
                    <div
                      className={`mt-1 h-3 w-3 rounded-full ${
                        stage.status === 'done'
                          ? 'bg-accent'
                          : stage.status === 'active'
                            ? 'bg-primary'
                            : 'bg-white/20'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">{stage.label}</p>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {stage.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{stage.detail}</p>
                      {index < pipelineStages.length - 1 && (
                        <div className="mt-3 h-px w-full bg-white/10" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <PremiumLoader text="Analyzing your content..." />
            <RouterFlow
              intent={routingResult?.intent}
              processedLocally={routingResult?.processedLocally}
              recommendedAgents={routingResult?.recommendedAgents}
            />

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-foreground">Progress</p>
                <p className="text-sm text-muted-foreground">{Math.min(Math.round(progress), 95)}%</p>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${Math.min(progress, 95)}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                  style={{ background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))' }}
                />
              </div>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 glass-card"
          >
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Processing Complete!</h2>
            <p className="text-muted-foreground mb-6">
              Redirecting to your results...
            </p>
            <div className="inline-flex gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="w-2 h-2 bg-accent rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 bg-accent rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 bg-accent rounded-full"
              />
            </div>
          </motion.div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}

export default function ProcessingPage() {
  return (
    <AppProvider>
      <NotificationProvider>
        <ProcessingContent />
      </NotificationProvider>
    </AppProvider>
  )
}
