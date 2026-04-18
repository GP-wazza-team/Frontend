import React, { useEffect, useState } from 'react'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useUIStore } from '../../store/uiStore'

function GenerationProgress({ runId }) {
  const { t } = useUIStore()
  const [steps, setSteps] = useState([])
  const [currentStep, setCurrentStep] = useState(0)

  const wsUrl = runId
    ? `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/api/generate/ws/${runId}`
    : null

  const { isConnected } = useWebSocket(wsUrl, {
    onMessage: (data) => {
      if (data.type === 'progress') {
        setCurrentStep(data.step)
        setSteps((prev) => {
          const updated = [...prev]
          updated[data.step] = {
            ...updated[data.step],
            status: 'completed',
          }
          return updated
        })
      } else if (data.type === 'step') {
        setSteps((prev) => [...prev, { name: data.step_name, status: 'in_progress' }])
      }
    },
  })

  if (!runId || !isConnected) return null

  return (
    <div className="card mb-4">
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.status === 'completed'
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                    ? 'bg-[#6c63ff] text-white animate-pulse'
                    : 'bg-[#2a2a3e] text-gray-400'
              }`}
            >
              {index + 1}
            </div>
            <div>
              <p className="text-sm font-medium">{step.name}</p>
              {step.status === 'completed' && <p className="text-xs text-green-400">Done</p>}
              {step.status === 'in_progress' && (
                <p className="text-xs text-[#6c63ff] animate-pulse">{t('generating')}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GenerationProgress
