import React from 'react'
import { useToastStore } from '../store/toastStore'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
}

function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-slideUp"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              minWidth: '260px',
              maxWidth: '380px',
            }}
          >
            <Icon
              size={18}
              style={{
                color:
                  toast.type === 'success'
                    ? '#34d399'
                    : toast.type === 'error'
                    ? '#fb7185'
                    : 'var(--accent)',
                flexShrink: 0,
              }}
            />
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-0.5 rounded-md transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default ToastContainer
