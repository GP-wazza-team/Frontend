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
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [prompt])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
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
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-4">
      {previewUrl && (
        <div className="max-w-4xl mx-auto mb-3">
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Attachment"
              className="h-20 w-auto rounded-xl border border-orange-200 object-cover shadow-sm"
            />
            <button
              onClick={removeAttachment}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-600 transition-colors shadow-md"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3
          focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all duration-200"
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
          title="Attach reference image"
          className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
            ${attachedFile
              ? 'bg-orange-100 text-orange-600'
              : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <ImagePlus size={18} />
        </button>

        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('enterPrompt')}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-slate-900 placeholder-gray-400 resize-none outline-none text-sm leading-6 disabled:opacity-50 max-h-[200px] overflow-y-auto scrollbar-hide"
          style={{ height: 'auto' }}
        />

        <button
          type="submit"
          disabled={disabled || (!prompt.trim() && !attachedFile)}
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
            bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-900"
        >
          {disabled ? (
            <Loader2 size={18} className="animate-spin text-white" />
          ) : (
            <Send size={18} className="text-white" />
          )}
        </button>
      </form>
      <p className="text-center text-gray-300 text-xs mt-2">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}

export default PromptInput
