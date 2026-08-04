/* ═══════════════════════════════════════════════════════════════════════════
   THE COMPOSER

   A field, on the card surface, pinned under the transcript. Not a floating
   pill and no longer hung off a 56px numbered gutter — that spine is gone from
   this whole scope.

   SEND IS NOT FILLED. Sending a prompt PLANS a run; it does not spend. The one
   filled control on this screen is the authorisation, and it lives in the top
   bar. Send is therefore an icon control that takes the accent when it can
   actually fire — colour marks the primary action, which is exactly what it is
   doing here — and the hint line says the keyboard route out loud.

   Behaviour is untouched: the same submit guard, the same Enter / Shift+Enter
   handling, the same object-URL lifecycle, the same file accept list.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState, useRef, useEffect } from 'react'
import { Send, Attach, Close, Sketch } from '../Icon'
import { useUIStore } from '../../store/uiStore'
import { useChatText } from './chatKit'

function PromptInput({ onSubmit, disabled = false }) {
  const [prompt, setPrompt] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  /* SKETCH MODE. Off by default, and deliberately not remembered between
     sends: it describes THIS file, and silently carrying it to the next one
     would redraw a photo the user wanted animated as-is. */
  const [sketchMode, setSketchMode] = useState(false)
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
    setSketchMode(false)
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    if ((prompt.trim() || attachedFile) && !disabled) {
      // The flag only means anything alongside a file — guarded here rather
      // than trusted, so a stale true can never reach the backend on a
      // text-only send.
      onSubmit(prompt.trim(), attachedFile, Boolean(attachedFile) && sketchMode)
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
      className="shrink-0 composer-safe px-4 sm:px-6"
      /* THE BAND IS NOT WHITE. It was --card across the full width of the
         window while the field inside it is capped at 900px, so the white read
         as a slab of chrome rather than as the thing you type into. The band
         now carries the page tone and the ONLY white on this row is the field
         itself, which is where the eye should land. */
      style={{
        background: 'var(--page)',
        borderBlockStart: '1px solid var(--line-2)',
        paddingBlock: 12,
      }}
    >
      <div style={{ maxInlineSize: 900, marginInline: 'auto' }}>
        {/* The attachment sits above the field, on the media surface every
            other frame in the app uses. The remove control is a bare mark. */}
        {previewUrl && (
          <div className="flex items-center gap-3" style={{ marginBlockEnd: 10 }}>
            <div className="well relative" style={{ inlineSize: 84 }}>
              <img
                src={previewUrl}
                alt={tx('attach')}
                style={{ display: 'block', inlineSize: '100%', blockSize: 'auto', maxBlockSize: 64, objectFit: 'contain' }}
              />
            </div>
            <div className="min-w-0">
              <div className="label">{tx('attach')}</div>
              <div className="flex items-center gap-1 flex-wrap">
                <button type="button" onClick={removeAttachment} className="btn-t btn-t--danger">
                  <Close size={14} />
                  {tx('removeAttachment')}
                </button>
              </div>
              {/* What the switch in the composer will DO to this file. The
                  toggle itself is an icon down there, so the consequence is
                  spelled out here in words — the same file animated as-is and
                  redrawn produce completely different videos, which is not
                  something the colour of an icon can carry on its own. */}
              <p className="caption" style={{ marginBlockStart: 2 }}>
                {sketchMode ? tx('sketchOnHint') : tx('sketchOffHint')}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* The field is the one white surface here, and it carries a real
              edge rather than the faintest hairline in the palette — on a warm
              band a 1px --line was almost invisible and the input had no
              boundary. --ink-3 clears 4:1 against both the band and the fill,
              so the box is unmistakably a box. The radius steps up to --r to
              match the cards in the transcript above it. */}
          <div
            className="flex items-end gap-2"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--ink-3)',
              borderRadius: 'var(--r)',
              paddingBlock: 5,
              paddingInline: 6,
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
              className="btn-i shrink-0"
              style={attachedFile ? { color: 'var(--ink)' } : undefined}
            >
              <Attach size={16} />
            </button>

            {/* THE SKETCH SWITCH. Its own control on the composer row, beside
                the paperclip, because it is a decision about the whole send —
                not a property of the thumbnail it used to be buried in, where
                nobody found it.

                It stays live with no file attached: the natural order is to
                say "this next one is a drawing" and then go and pick it. The
                send guard already refuses to pass the flag without a file, so
                an armed switch on a text-only send costs nothing, and the hint
                under the field says what it is still waiting for. */}
            <button
              type="button"
              onClick={() => setSketchMode((on) => !on)}
              disabled={disabled}
              aria-pressed={sketchMode}
              title={`${tx('sketchToggle')} — ${tx('sketchModeTitle')}`}
              aria-label={tx('sketchToggle')}
              className="btn-i shrink-0"
              style={sketchMode ? { color: 'var(--accent)' } : undefined}
            >
              <Sketch size={16} />
            </button>

            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('enterPrompt')}
              disabled={disabled}
              rows={1}
              aria-label={t('enterPrompt')}
              className="flex-1 bg-transparent resize-none outline-none disabled:opacity-50 max-h-[160px] overflow-y-auto scrollbar-hide"
              style={{
                color: 'var(--ink)',
                fontSize: 15,
                lineHeight: 'var(--lh)',
                paddingBlock: 6,
                textAlign: 'start',
              }}
            />

            <button
              type="submit"
              disabled={!canSend}
              title={tx('costsCredits')}
              aria-label={t('send')}
              className="btn-i shrink-0"
              style={canSend ? { color: 'var(--accent)' } : undefined}
            >
              <Send size={16} />
            </button>
          </div>
        </form>

        {/* An armed switch with nothing to apply it to would otherwise be a
            control that looks active and does nothing. */}
        <p className="caption" style={{ marginBlockStart: 6 }}>
          {sketchMode && !attachedFile ? tx('sketchNeedsFile') : tx('sendHint')}
        </p>
      </div>
    </div>
  )
}

export default PromptInput
