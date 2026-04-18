import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2, ImagePlus, X } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'

function PromptInput({ onSubmit, disabled = false }) {
  const [prompt, setPrompt] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)   // File object
  const [previewUrl, setPreviewUrl] = useState(null)       // local blob URL for preview
  const { t } = useUIStore()
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  // auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [prompt])

  // cleanup blob URL on unmount or when attachment changes
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
    // reset the input so the same file can be re-selected
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
    <div className="border-t border-[#1e1e2e] bg-[#0a0a0f] px-4 py-4">
      {/* Image preview strip */}
      {previewUrl && (
        <div className="max-w-4xl mx-auto mb-2">
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Attachment"
              className="h-20 w-auto rounded-xl border border-[#6c63ff]/40 object-cover"
            />
            <button
              onClick={removeAttachment}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X size={11} className="text-white" />
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto flex items-end gap-3 bg-[#13131f] border border-[#2a2a3e] rounded-2xl px-4 py-3 focus-within:border-[#6c63ff] transition-colors"
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Image attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Attach reference image"
          className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all
            ${attachedFile
              ? 'bg-[#6c63ff]/30 text-[#6c63ff]'
              : 'text-gray-500 hover:text-[#6c63ff] hover:bg-[#6c63ff]/10'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
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
          className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none text-sm leading-6 disabled:opacity-50 max-h-[200px] overflow-y-auto scrollbar-hide"
          style={{ height: 'auto' }}
        />

        <button
          type="submit"
          disabled={disabled || (!prompt.trim() && !attachedFile)}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all
            bg-[#6c63ff] hover:bg-[#5a52e0] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {disabled ? (
            <Loader2 size={16} className="animate-spin text-white" />
          ) : (
            <Send size={16} className="text-white" />
          )}
        </button>
      </form>
      <p className="text-center text-gray-600 text-xs mt-2">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}

export default PromptInput
