/* ═══════════════════════════════════════════════════════════════════════════
   THE COMPOSER

   A sunken well on the gutter grid, not a floating pill. The attach mark is
   bare and inline-start; the send control is a 32x32 chamfered square carrying
   the FILLED arrow, because pressing it starts a run and a run costs money
   (L1). The hint line sits in the leading gutter at 10px rather than centred
   under the box, where it used to fight the spine.

   Behaviour is untouched: the same submit guard, the same Enter / Shift+Enter
   handling, the same object-URL lifecycle, the same file accept list.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState, useRef, useEffect } from 'react'
import { Send, Attach, Close } from '../Icon'
import Meter from '../ui/Meter'
import { useUIStore } from '../../store/uiStore'
import { useChatText, TURN_GRID } from './chatKit'

function PromptInput({ onSubmit, disabled = false }) {
  const [prompt, setPrompt] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const { t } = useUIStore()
  const { tx } = useChatText()
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [prompt])

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setAttachedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    e.target.value = ''
  }

  const removeAttachment = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setAttachedFile(null)
    setPreviewUrl(null)
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    if ((prompt.trim() || attachedFile) && !disabled) {
      onSubmit(prompt.trim(), attachedFile)
      setPrompt('')
      removeAttachment()
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const canSend = !disabled && (prompt.trim() || attachedFile)

  return (
    <div
      className="shrink-0 chat-pad composer-safe"
      style={{
        backgroundColor: 'var(--paper)',
        borderBlockStart: '1px solid var(--etch)',
        paddingBlock: 12,
        paddingInline: 24,
      }}
    >
      {/* The attachment sits in the gutter column's row above the well, so it
          reads as belonging to the message being composed rather than floating
          over it. The remove control is a bare mark in --state-fail — there is
          no coloured disc anywhere in this application. */}
      {previewUrl && (
        <div className={`${TURN_GRID} mb-3`}>
          <span className="wz-gutter" style={{ fontSize: 10 }}>{tx('attach')}</span>
          <div className="min-w-0">
            <div
              className="cut cut-md relative inline-block"
              style={{ backgroundColor: 'var(--recess)', boxShadow: 'inset 0 0 0 1px var(--etch-strong)', padding: 6 }}
            >
              <img src={previewUrl} alt={tx('attach')} style={{ display: 'block', blockSize: 56, inlineSize: 'auto' }} />
              <button
                type="button"
                onClick={removeAttachment}
                title={tx('removeAttachment')}
                aria-label={tx('removeAttachment')}
                className="absolute flex items-center justify-center"
                style={{
                  insetBlockStart: 0,
                  insetInlineEnd: 0,
                  inlineSize: 20,
                  blockSize: 20,
                  color: 'var(--state-fail)',
                  backgroundColor: 'var(--recess)',
                }}
              >
                <Close size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={TURN_GRID}>
        <span className="wz-gutter" style={{ paddingBlockStart: 12 }} aria-hidden="true" />

        <div className="min-w-0">
          <div
            className="cut cut-md flex items-end gap-2"
            style={{
              backgroundColor: 'var(--sunk)',
              boxShadow: 'inset 0 0 0 1px var(--edge)',
              paddingBlock: 6,
              paddingInlineStart: 8,
              paddingInlineEnd: 8,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              title={tx('attach')}
              aria-label={tx('attach')}
              className="shrink-0 flex items-center justify-center disabled:opacity-40"
              style={{
                inlineSize: 32,
                blockSize: 32,
                color: attachedFile ? 'var(--ink)' : 'var(--ink-3)',
                transition: 'color 120ms var(--ease)',
              }}
            >
              <Attach size={16} />
            </button>

            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('enterPrompt')}
              disabled={disabled}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none disabled:opacity-50 max-h-[160px] overflow-y-auto scrollbar-hide"
              style={{
                color: 'var(--ink)',
                fontSize: 15,
                lineHeight: 'var(--lh-body)',
                paddingBlock: 7,
                textAlign: 'start',
              }}
            />

            {/* FILL IS MONEY. The mark is drawn filled and inked in --signal
                because sending a prompt opens a paid run; the square itself is
                not a slab, so the commit gate stays the only filled surface on
                the screen. */}
            <button
              type="submit"
              disabled={!canSend}
              title={tx('costsCredits')}
              aria-label={t('send')}
              className="cut cut-md shrink-0 flex items-center justify-center disabled:opacity-30"
              style={{
                inlineSize: 32,
                blockSize: 32,
                color: canSend ? 'var(--signal)' : 'var(--ink-3)',
                backgroundColor: canSend ? 'var(--panel)' : 'transparent',
                boxShadow: canSend ? 'inset 0 0 0 1px var(--signal-edge)' : 'inset 0 0 0 1px var(--etch)',
                transition: 'color 120ms var(--ease), background-color 120ms var(--ease)',
              }}
            >
              {disabled
                ? <Meter cells={3} mode="indeterminate" tone="signal" label={t('generating')} />
                : <Send size={16} />}
            </button>
          </div>
        </div>
      </form>

      <p
        className={`${TURN_GRID} mt-2`}
        style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'start' }}
      >
        {/* The hint annotates the composer, so it belongs in the composer's
            column. Spanning the grid started it 56px ahead of the thing it
            describes and broke the spine. */}
        <span className="wz-col">{tx('sendHint')}</span>
      </p>
    </div>
  )
}

export default PromptInput
