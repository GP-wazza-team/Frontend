/* Centred dialog. 420px, chamfered, on --panel, over a plain scrim with NO
   blur. It settles in on a transform; opacity is 1 from the first frame (L5).

   The destructive confirm is a TEXT ACTION in --state-fail, not a fill:
   deleting a chat does not cost money, and in this system only spending is
   filled (L1). Pass `costs` when the confirmed action really does spend
   credits — that is the only case that earns a slab.

   The isOpen / title / message / confirmLabel / cancelLabel / onConfirm /
   onCancel / danger API is unchanged. */

import React, { useEffect, useRef } from 'react'

function ConfirmDialog({
  isOpen, title, message, confirmLabel, cancelLabel,
  onConfirm, onCancel, danger = false, costs = false,
}) {
  const confirmRef = useRef(null)
  const dialogRef = useRef(null)
  const restoreRef = useRef(null)

  /* Every caller passes an inline arrow for onCancel, so its identity changes
     on every parent render. With onCancel in the dep list, any re-render while
     the dialog is open tore the trap down and rebuilt it: the cleanup handed
     focus back to the trigger and the re-run then captured the dialog's own
     confirm button as the thing to restore to — so closing returned focus to
     an unmounting node, i.e. to <body>. The callback lives in a ref, the
     effect depends on `isOpen` alone, and the capture is guarded so it happens
     once per open. */
  const cancelRef = useRef(onCancel)
  cancelRef.current = onCancel

  useEffect(() => {
    if (!isOpen) return undefined

    if (!restoreRef.current) restoreRef.current = document.activeElement
    confirmRef.current?.focus()

    const handleKey = (e) => {
      if (e.key === 'Escape') { cancelRef.current(); return }
      if (e.key !== 'Tab' || !dialogRef.current) return
      // Keep focus inside the dialog while it is open.
      const focusables = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      // Return focus to whatever opened the dialog.
      if (restoreRef.current && typeof restoreRef.current.focus === 'function') {
        restoreRef.current.focus()
      }
      restoreRef.current = null
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-overlay flex items-center justify-center" style={{ padding: 16 }}>
      <div className="absolute inset-0" style={{ backgroundColor: 'var(--scrim)' }} onClick={onCancel} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wz-confirm-title"
        className="relative settle overlay-cast"
        style={{
          inlineSize: '100%',
          maxInlineSize: 420,
          backgroundColor: 'var(--panel)',
          boxShadow: 'inset 0 0 0 1px var(--etch-strong)',
          paddingBlock: 24,
          paddingInlineStart: 24,
          paddingInlineEnd: 24,
        }}
      >
        <h2 id="wz-confirm-title" className="page-title" style={{ marginBlockEnd: 8 }}>
          {title || 'Are you sure?'}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{message}</p>

        <div className="flex items-center justify-end gap-6" style={{ marginBlockStart: 24 }}>
          <button type="button" onClick={onCancel} className="text-action">
            {cancelLabel || 'Cancel'}
          </button>

          {costs ? (
            <button ref={confirmRef} type="button" onClick={onConfirm} className="slab slab--sm">
              {confirmLabel || 'Confirm'}
            </button>
          ) : (
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              className={`text-action${danger ? ' text-action--danger' : ''}`}
              style={danger ? undefined : { color: 'var(--ink)' }}
            >
              {confirmLabel || 'Confirm'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
