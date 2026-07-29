import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { X, ExternalLink } from 'lucide-react'

/**
 * Full-screen viewer for generated images and video.
 *
 * Media is rendered at thumbnail size in six different places (chat bubbles,
 * scene results, plan previews, the asset grid, the run timeline), so this is a
 * context rather than a prop: any of them can call openMedia() without the
 * lightbox having to be threaded through every component in between.
 */
const LightboxContext = createContext(() => {})

export const useLightbox = () => useContext(LightboxContext)

export function LightboxProvider({ children }) {
  const [item, setItem] = useState(null)

  const openMedia = useCallback((url, type = 'image') => {
    if (url) setItem({ url, type })
  }, [])

  const close = useCallback(() => setItem(null), [])

  useEffect(() => {
    if (!item) return
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    // Stop the chat scrolling behind the overlay.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [item, close])

  return (
    <LightboxContext.Provider value={openMedia}>
      {children}
      {item && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn"
          style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Open original in a new tab"
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
            >
              <ExternalLink size={16} />
            </a>
            <button
              type="button"
              onClick={close}
              title="Close (Esc)"
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Clicks on the media itself must not close it — only the backdrop. */}
          <div className="max-w-[92vw] max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
            {item.type === 'video' ? (
              <video
                controls
                autoPlay
                src={item.url}
                className="max-w-[92vw] max-h-[92vh] rounded-lg"
              />
            ) : (
              <img
                src={item.url}
                alt="Generated"
                className="max-w-[92vw] max-h-[92vh] object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </LightboxContext.Provider>
  )
}

export default LightboxProvider
