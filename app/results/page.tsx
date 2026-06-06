'use client'

import { motion } from 'framer-motion'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { ResultCard } from '@/components/results/ResultCard'
import { GlassmorphismCard } from '@/components/cards/GlassmorphismCard'
import { AppProvider, useApp } from '@/contexts/AppContext'
import { NotificationProvider } from '@/contexts/NotificationContext'

const resultIcons = {
  assignment: '📚',
  notes: '📝',
  receipt: '🧾',
  job: '💼',
  menu: '🍽️',
}

function ResultsContent() {
  const { processingResult } = useApp()

  if (!processingResult) {
    return (
      <div className="min-h-screen bg-background pb-32 pt-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">Results</h1>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-6">No results yet</p>
            <p className="text-sm text-muted-foreground">
              Process something to see results here
            </p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  const { type, data } = processingResult
  const icon = resultIcons[type as keyof typeof resultIcons]

  return (
    <div className="min-h-screen bg-background pb-32 pt-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Results</h1>
          <p className="text-muted-foreground text-sm mt-1">Your AI-processed insights</p>
        </motion.div>

        {/* Result Type: Assignment */}
        {type === 'assignment' && (
          <>
            <ResultCard title={data.title} icon={icon} delay={0.1}>
              <p className="text-sm text-muted-foreground">{data.summary}</p>
              <div className="mt-4 p-3 bg-accent/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Deadline</p>
                <p className="font-bold text-accent">{data.deadline} remaining</p>
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold text-foreground mb-3">Study Plan</p>
                <ol className="space-y-2">
                  {data.studyPlan.map((step: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <span className="flex-shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </ResultCard>
          </>
        )}

        {/* Result Type: Notes */}
        {type === 'notes' && (
          <>
            <ResultCard title={data.title} icon={icon} delay={0.1}>
              <p className="text-sm text-muted-foreground">{data.summary}</p>
              <div className="mt-4">
                <p className="text-xs font-semibold text-foreground mb-3">Flashcards</p>
                <div className="space-y-2">
                  {data.flashcards.map((card: any, i: number) => (
                    <GlassmorphismCard key={i} hover={false}>
                      <p className="text-xs text-muted-foreground">Q: {card.front}</p>
                      <p className="text-sm text-accent font-medium mt-2">A: {card.back}</p>
                    </GlassmorphismCard>
                  ))}
                </div>
              </div>
            </ResultCard>
          </>
        )}

        {/* Result Type: Receipt */}
        {type === 'receipt' && (
          <>
            <ResultCard title={data.title} icon={icon} delay={0.1}>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Merchant</span>
                  <span className="font-medium text-foreground">{data.merchant}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-bold text-accent text-lg">{data.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                    {data.category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="text-sm text-foreground">{data.date}</span>
                </div>
                <div className="mt-4 p-3 bg-accent/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Smart Insight</p>
                  <p className="text-sm text-accent">{data.insight}</p>
                </div>
              </div>
            </ResultCard>
          </>
        )}

        {/* Result Type: Job */}
        {type === 'job' && (
          <>
            <ResultCard title={data.title} icon={icon} delay={0.1}>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Position</p>
                  <p className="font-semibold text-foreground">{data.position}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Match Score</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${data.matchPercentage}%` }}
                        transition={{ duration: 1 }}
                        className="h-full bg-gradient-to-r from-primary to-accent"
                      />
                    </div>
                    <span className="font-bold text-foreground">{data.matchPercentage}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Key Skills Required</p>
                  <div className="flex flex-wrap gap-2">
                    {data.keySkills.map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Application Draft</p>
                  <p className="text-xs text-foreground italic">{data.applicationDraft}</p>
                </div>
              </div>
            </ResultCard>
          </>
        )}

        {/* Result Type: Menu */}
        {type === 'menu' && (
          <>
            <ResultCard title={data.title} icon={icon} delay={0.1}>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Today&apos;s Meal</p>
                  <p className="font-semibold text-foreground text-lg">{data.todaysMeal}</p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 bg-white/5 rounded-lg">
                    <p className="text-xs text-muted-foreground">Cal</p>
                    <p className="font-bold text-foreground">{data.nutrition.calories}</p>
                  </div>
                  <div className="text-center p-2 bg-white/5 rounded-lg">
                    <p className="text-xs text-muted-foreground">Protein</p>
                    <p className="font-bold text-foreground">{data.nutrition.protein}g</p>
                  </div>
                  <div className="text-center p-2 bg-white/5 rounded-lg">
                    <p className="text-xs text-muted-foreground">Carbs</p>
                    <p className="font-bold text-foreground">{data.nutrition.carbs}g</p>
                  </div>
                  <div className="text-center p-2 bg-white/5 rounded-lg">
                    <p className="text-xs text-muted-foreground">Fat</p>
                    <p className="font-bold text-foreground">{data.nutrition.fat}g</p>
                  </div>
                </div>
                <div className="p-3 bg-accent/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Recommendation</p>
                  <p className="text-sm text-accent">{data.recommendation}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Alternative Options</p>
                  <div className="space-y-2">
                    {data.alternativeOptions.map((option: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>→</span>
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ResultCard>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button className="flex-1 glass-button bg-primary text-primary-foreground">
            Save Result
          </button>
          <button className="flex-1 glass-button">Share</button>
        </div>
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
