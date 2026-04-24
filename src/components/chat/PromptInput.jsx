import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2, ImagePlus, X } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'

function PromptInput({ onSubmit, disabled = false }) {
  const [prompt, setPrompt] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const { t } = useUIStore()
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

  return (
    <div className="px-4 py-4" style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
      {previewUrl && (
        <div className="max-w-3xl mx-auto mb-2.5">
          <div className="relative inline-block">
            <img src={previewUrl} alt="Attachment" className="h-16 w-auto rounded-lg object-cover" style={{ border: '1px solid var(--border)' }} />
            <button onClick={removeAttachment} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-600 transition-colors">
              <X size={10} className="text-white" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-end gap-2 rounded-xl px-3 py-2.5 transition-all duration-200" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleFileChange} />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
          style={{ color: attachedFile ? 'var(--accent)' : 'var(--text-tertiary)' }}
        >
          <ImagePlus size={16} />
        </button>

        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('enterPrompt')}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-[14px] leading-5 disabled:opacity-50 max-h-[160px] overflow-y-auto scrollbar-hide py-1"
          style={{ color: 'var(--text-primary)' }}
        />

        <button
          type="submit"
          disabled={disabled || (!prompt.trim() && !attachedFile)}
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {disabled ? <Loader2 size={15} className="animate-spin text-white" /> : <Send size={15} className="text-white" />}
        </button>
      </form>
      <p className="text-center text-[11px] mt-1.5" style={{ color: 'var(--text-tertiary)' }}>Enter to send · Shift+Enter for new line</p>
    </div>
  )
}

export default PromptInput
