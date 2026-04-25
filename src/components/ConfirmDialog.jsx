import React, { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'

function ConfirmDialog({ isOpen, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, danger = false }) {
  const confirmRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      confirmRef.current?.focus()
      const handleKey = (e) => {
        if (e.key === 'Escape') onCancel()
      }
      document.addEventListener('keydown', handleKey)
      return () => document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={onCancel} />
      <div
        className="relative w-full max-w-sm rounded-xl p-6 animate-scaleIn"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: danger ? 'rgba(244,63,94,0.1)' : 'rgba(217,119,87,0.1)' }}
          >
            <AlertTriangle size={18} style={{ color: danger ? '#fb7185' : 'var(--accent)' }} />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              {title || 'Are you sure?'}
            </h3>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            {cancelLabel || 'Cancel'}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all"
            style={{ backgroundColor: danger ? '#e11d48' : 'var(--accent)' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
