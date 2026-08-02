/* Toasts. Chamfered plates docked at the block-end / inline-end corner.
   The type is carried by the bare mark and the ink tone — never by a tinted
   background, because tinted pill chips are gone from this system.
   They settle in on a transform. Opacity stays at 1 the whole time (L5). */

import React from 'react'
import { useToastStore } from '../store/toastStore'
import { Check, Void, Note, Close } from './Icon'

const KIND = {
  success: { Mark: Check, tone: 'var(--state-done)' },
  error: { Mark: Void, tone: 'var(--state-fail)' },
  info: { Mark: Note, tone: 'var(--ink-2)' },
}

function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed z-overlay flex flex-col gap-3 pointer-events-none"
      style={{ insetBlockEnd: 16, insetInlineEnd: 16 }}
      role="region"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const { Mark, tone } = KIND[toast.type] || KIND.info
        return (
          <div
            key={toast.id}
            className="pointer-events-auto settle cut cut-md overlay-cast flex items-start gap-3"
            style={{
              minInlineSize: 260,
              maxInlineSize: 380,
              backgroundColor: 'var(--panel)',
              color: 'var(--ink)',
              boxShadow: 'inset 0 0 0 1px var(--etch-strong)',
              paddingBlock: 12,
              paddingInlineStart: 14,
              paddingInlineEnd: 15,
              fontSize: 13,
            }}
          >
            <span style={{ color: tone, marginBlockStart: 1 }}>
              <Mark size={16} />
            </span>
            <span className="flex-1 min-w-0" style={{ lineHeight: 1.4 }}>{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-action"
              style={{ padding: 2, marginBlockStart: 1 }}
              aria-label="Dismiss"
            >
              <Close size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default ToastContainer
