/* ═══════════════════════════════════════════════════════════════════════════
   THE LIGHTBOX — full-size view of a generated artifact.

   Media is rendered at thumbnail size in six different places (the transcript,
   scene results, plan previews, the asset grid, the run drawer), so this is a
   context rather than a prop: any of them can call openMedia() without the
   lightbox being threaded through every component in between. That behaviour —
   openMedia, close, Escape, the body-overflow lock — is unchanged.

   WHAT CHANGED is that the artifact is now rendered in the app's ONE <Frame>:
   the same recess well, the same registration marks and the same Commit Mono
   caption rail as a print in the library and a preview in the transcript. This
   is the surface a user lands on every time they open an image, and it was the
   last screen still carrying the previous design's vocabulary.

   The two controls are bare marks in the Frame's caption rail — no floating
   tiles, no tinted boxes, and no absolute `top-3 right-3`, which pinned them to
   the visual right in Arabic instead of the reading end. There is nothing left
   to mirror: the rail is a flex row on logical properties.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import Frame from './ui/Frame'
import { Close, External } from './Icon'
import { useUIStore } from '../store/uiStore'

const LightboxContext = createContext(() => {})

export const useLightbox = () => useContext(LightboxContext)

/* The caption reads real data off the object, the way every other Frame in the
   application does: the artifact's kind and its file name. */
function fileNameOf(url) {
  try {
    const path = new URL(url, window.location.origin).pathname
    const last = path.split('/').filter(Boolean).pop()
    return last ? decodeURIComponent(last) : ''
  } catch (_) {
    return ''
  }
}

export function LightboxProvider({ children }) {
  const [item, setItem] = useState(null)
  const language = useUIStore((s) => s.language)
  const ar = language === 'ar'

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

  const labels = {
    view: ar ? 'عرض الوسائط' : 'Media viewer',
    original: ar ? 'فتح الأصل في تبويب جديد' : 'Open the original in a new tab',
    close: ar ? 'إغلاق (Esc)' : 'Close (Esc)',
  }

  return (
    <LightboxContext.Provider value={openMedia}>
      {children}
      {item && (
        <div
          className="fixed inset-0 z-overlay flex items-center justify-center"
          style={{ padding: 24, backgroundColor: 'var(--scrim)' }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={labels.view}
        >
          {/* Clicks on the artifact itself must not close it — only the scrim. */}
          <div
            className="settle overlay-cast"
            style={{ maxInlineSize: '92vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Frame
              caption={[item.type === 'video' ? 'video' : 'image', fileNameOf(item.url)]}
              actions={(
                <span className="flex items-center gap-3 flex-none">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-action"
                    style={{ padding: 0 }}
                    title={labels.original}
                    aria-label={labels.original}
                  >
                    <External size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={close}
                    className="text-action"
                    style={{ padding: 0 }}
                    title={labels.close}
                    aria-label={labels.close}
                    autoFocus
                  >
                    <Close size={14} />
                  </button>
                </span>
              )}
            >
              {item.type === 'video' ? (
                <video
                  controls
                  autoPlay
                  src={item.url}
                  style={{
                    display: 'block',
                    maxInlineSize: 'calc(92vw - 68px)',
                    maxBlockSize: 'calc(92vh - 84px)',
                  }}
                />
              ) : (
                <img
                  src={item.url}
                  alt=""
                  style={{
                    display: 'block',
                    maxInlineSize: 'calc(92vw - 68px)',
                    maxBlockSize: 'calc(92vh - 84px)',
                  }}
                />
              )}
            </Frame>
          </div>
        </div>
      )}
    </LightboxContext.Provider>
  )
}

export default LightboxProvider
