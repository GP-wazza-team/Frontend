/* ── THE FRAME ─────────────────────────────────────────────────────────────
   THE single object for every piece of generated media in the application.
   One implementation, one location — a preview in the transcript, a preview on
   the plan docket, a thumbnail in the run drawer, a print in the library and
   the full-size view in the lightbox are all visibly the same artifact. That
   is the whole reason the primitive exists, so there is exactly one of it.

   Construction:
     · a --recess well carrying the 8px chamfer and an inset --etch-strong edge
     · a 10px mat, budgeted against the 8px cut so the corner never slices media
     · the media at its TRUE aspect ratio — object-fit is deliberately absent.
       A tool that sells 9:16 and 21:9 must never crop the thing the user paid
       for, which is what the old aspect-square grid did to every asset.
     · THREE registration marks, not four: the chamfered corner IS the fourth.
       A mark inset 4px there would sit inside the removed triangle.
     · a Commit Mono caption rail on --panel reading real data off the object:
           04 · 1080p 16:9 · 5.0s · seedance

   `caption` takes either a node or an array of parts; empty parts are dropped
   and the rest joined with a middot, which is how the drawer, the transcript
   and the library all read them.

   Every position is a logical property, so the object is mirrored-first. */

import React from 'react'

function Registration() {
  const mark = (style) => (
    <svg
      width="11" height="11" viewBox="0 0 11 11" aria-hidden="true"
      style={{ position: 'absolute', pointerEvents: 'none', ...style }}
    >
      <path d="M0 5.5 H11 M5.5 0 V11" stroke="var(--etch-strong)" strokeWidth="1" fill="none" />
    </svg>
  )
  return (
    <>
      {mark({ insetBlockStart: 4, insetInlineStart: 4 })}
      {mark({ insetBlockEnd: 4, insetInlineStart: 4 })}
      {mark({ insetBlockEnd: 4, insetInlineEnd: 4 })}
    </>
  )
}

/* Media that keeps its own ratio. object-fit is deliberately absent. */
export const mediaStyle = { display: 'block', inlineSize: '100%', blockSize: 'auto' }

export function Frame({
  caption, actions, children, onOpen, interactive = false,
  maxWidth, wellStyle, className = '', style, ...rest
}) {
  const isList = Array.isArray(caption)
  const text = isList
    ? caption.filter((p) => p !== null && p !== undefined && p !== '').join(' · ')
    : caption
  const hasCaption = text !== null && text !== undefined && text !== '' && text !== false

  return (
    <figure
      className={className}
      style={{ margin: 0, ...(maxWidth ? { maxInlineSize: maxWidth } : null), ...style }}
      {...rest}
    >
      <div
        className="plate--recess cut cut-lg"
        style={{ position: 'relative', padding: 10, lineHeight: 0, ...wellStyle }}
      >
        {interactive ? (
          <button
            type="button"
            onClick={onOpen}
            style={{ display: 'block', inlineSize: '100%', cursor: 'zoom-in', background: 'none', padding: 0 }}
          >
            {children}
          </button>
        ) : children}
        <Registration />
      </div>

      {(hasCaption || actions) && (
        <figcaption
          className="flex items-center gap-3"
          style={{
            backgroundColor: 'var(--panel)',
            boxShadow: 'inset 0 0 0 1px var(--etch)',
            paddingBlock: 5,
            paddingInlineStart: 10,
            paddingInlineEnd: 8,
            minBlockSize: 28,
          }}
        >
          <span
            className="mono truncate"
            style={{ fontSize: 10, color: 'var(--ink-3)', flex: 1, textAlign: 'start', lineHeight: 1.6 }}
            title={typeof text === 'string' ? text : undefined}
          >
            {text}
          </span>
          {actions}
        </figcaption>
      )}
    </figure>
  )
}

export default Frame
