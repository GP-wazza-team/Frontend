/* ═══════════════════════════════════════════════════════════════════════════
   WAZZA · MIQYAS — THE ICON SET
   Hand-drawn. Nothing here comes from an icon package.

   HOUSE STYLE — non-negotiable, applies to every mark.
     · 20 x 20 viewBox. Not 24. Geometry snaps to a 2px sub-grid.
     · stroke-width 1.5, stroke="currentColor", fill="none" by default.
     · stroke-linecap BUTT. stroke-linejoin MITER. Never round — round caps
       are the stock-icon-pack fingerprint.
     · Outer geometry has zero corner radius.
     · Arrows are 45 degree diagonals, never a horizontal chevron.
     · No mark ever sits inside a tile, chip, circle or tinted box. Anywhere.

   THE THREE INVENTED CONSTANTS — this is what makes the set ours.
     I1  THE NOTCH. Every plate-bodied mark carries one 3.5px 45 degree
         chamfer at its block-start / inline-end corner — the identical cut
         that every panel, button and the auth plate carries. Icons and
         containers are stamped from one die. The notch follows the LOGICAL
         corner: marks flagged `mirror` flip their geometry inside the SVG
         under [dir=rtl], so the cut is top-end in both directions.
     I2  THE TICK ROW. Any mark representing a MEASURABLE QUANTITY — cost,
         duration, credits, progress, tokens, count — carries three marks
         along its bottom edge at x = 5, 10, 15. Non-quantitative marks never
         carry it. The set encodes a semantic distinction no icon pack has.
     I3  FILL IS MONEY (L1). Marks are hollow by default. A mark is drawn
         FILLED only when the action it labels spends real credits. The
         complete filled list: Send, Retry, Character, Environment, Commit.
         Everything else is hollow, because everything else is free.

   USAGE
     import { Chat, Ledger, Close } from '../components/Icon'
     <Chat size={16} />                      // size defaults to 16
     <Caret size={16} direction="down" />    // caret is the only rotatable mark
     Colour comes from `currentColor`. Set it on the parent, or pass
     className="text-[var(--ink-3)]" / style={{ color: 'var(--ink-3)' }}.

   SIZES  16px in dense rows and controls · 20px in the rail spine ·
          14px inside a 24px action bar. Never larger than 20px in the product.
   ═══════════════════════════════════════════════════════════════════════════ */

import React from 'react'
import { useUIStore } from '../store/uiStore'

/* The direction the marks are stamped for. App.jsx drives html[dir] from this
   same value, so the notch can never disagree with the container chamfer. */
export function useRtl() {
  return useUIStore((s) => s.language === 'ar')
}

function Svg({ size = 16, className = '', mirror = false, children, ...rest }) {
  const rtl = useRtl()
  const flip = mirror && rtl
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      className={`wz-icon${className ? ' ' + className : ''}`}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {flip ? <g transform="translate(20,0) scale(-1,1)">{children}</g> : children}
    </svg>
  )
}

/* I1 — the notched plate. One die, every mark. */
const plate = (x = 2, y = 2, w = 16, h = 16, c = 3.5) =>
  `M${x} ${y} H${x + w - c} L${x + w} ${y + c} V${y + h} H${x} Z`

/* I2 — the tick row. Quantitative marks only. */
const TICKS = 'M5 16.4 V18.4 M10 16.4 V18.4 M15 16.4 V18.4'

/* ── NAVIGATION ─────────────────────────────────────────────────────────── */

/* The transcript, not a speech bubble. One flush entry rule (the assistant)
   and one indented rule carrying the 2px seam bar (you) — the exact grammar
   of the chat surface it opens. */
export const Chat = (p) => (
  <Svg mirror {...p}>
    <path d={plate(2, 3, 16, 14)} />
    <path d="M5 7.5 H14.5" />
    <path d="M8.5 12 H14.5" />
    <path d="M5.9 10 V14" />
  </Svg>
)

/* Ruled entries with a running total, and the tick row: this is the ledger. */
export const Ledger = (p) => (
  <Svg mirror {...p}>
    <path d={plate(2, 2, 16, 13)} />
    <path d="M5 6.5 H14.5" />
    <path d="M5 9.5 H11.5" />
    <path d="M5 12.5 H14.5" />
    <path d={TICKS} />
  </Svg>
)

/* A stack of prints. The front plate carries the notch. */
export const Library = (p) => (
  <Svg mirror {...p}>
    <path d="M6.5 2.5 H17.5 V13.5" />
    <path d={plate(2, 6, 13, 12)} />
    <path d="M2 15 L6 11 L8.5 13.5 L11 11 L15 15" />
  </Svg>
)

/* Not a shield. A plate inside a plate: the console seen from above, the one
   view that contains all the others. Structurally distinct from every
   rule-bearing mark, so it still reads at 16px in the spine. */
export const Admin = (p) => (
  <Svg mirror {...p}>
    <path d={plate(2, 2, 16, 16)} />
    <path d={plate(6, 6, 8, 8, 2)} />
  </Svg>
)

/* Not a gear. A fader bank — three rules, three handles, an instrument. */
export const Settings = (p) => (
  <Svg mirror {...p}>
    <path d="M2.5 5.5 H17.5" />
    <path d="M2.5 10 H17.5" />
    <path d="M2.5 14.5 H17.5" />
    <path d="M11.5 4 H14.5 V7 H11.5 Z" />
    <path d="M5 8.5 H8 V11.5 H5 Z" />
    <path d="M12.5 13 H15.5 V16 H12.5 Z" />
  </Svg>
)

/* ── THE BRAND MARK ─────────────────────────────────────────────────────── */

/* THE GATE. A chamfered plate carrying three ascending meter ticks. Two are
   hollow, the tallest is filled. The logo teaches the product's own rule:
   two things are free, one costs money. Same geometry as every panel in the
   app, language-neutral, legible at 16px. */
export const Mark = ({ size = 20, className = '', ...rest }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="butt"
    strokeLinejoin="miter"
    className={`wz-icon${className ? ' ' + className : ''}`}
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    <path d="M2 2 H14.5 L18 5.5 V18 H2 Z" />
    <path d="M6 14 V11" />
    <path d="M10 14 V8.5" />
    <rect x="12.25" y="4.5" width="2.5" height="9.5" fill="currentColor" stroke="none" />
  </svg>
)

/* ── RAIL ───────────────────────────────────────────────────────────────── */

/* An ID plate. No circle, no initials disc, no avatar. */
export const Account = (p) => (
  <Svg mirror {...p}>
    <path d={plate(2, 4, 16, 12)} />
    <path d="M4.5 7 H8 V10.5 H4.5 Z" />
    <path d="M10 8 H15.5" />
    <path d="M4.5 13 H15.5" />
  </Svg>
)

/* A tonal step wedge, not a sun and a moon. */
export const Theme = (p) => (
  <Svg mirror {...p}>
    <path d={plate(2, 2, 16, 16)} />
    <path d="M10 2 V18" />
    <path d="M4.5 7 H7.5" />
    <path d="M4.5 10 H7.5" />
    <path d="M4.5 13 H7.5" />
  </Svg>
)

/* Two scripts inside one bracket pair. No flags, no globes. */
export const Language = (p) => (
  <Svg {...p}>
    <path d="M7 3.5 H3.5 V16.5 H7" />
    <path d="M13 3.5 H16.5 V16.5 H13" />
    <path d="M10 6 V14" />
  </Svg>
)

/* ── CHAT ───────────────────────────────────────────────────────────────── */

/* FILLED (I3): sending a prompt starts a run, and a run costs money.
   A solid 45 degree arrow flying up and out of the frame. */
export const Send = (p) => (
  <Svg mirror {...p}>
    <path
      d="M16.6 3.4 V11.2 L13.4 8 L4.8 16.6 L3.4 15.2 L12 6.6 L8.8 3.4 Z"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
)

/* A flat clip at 45 degrees. No paperclip curve — there are no curves here. */
export const Attach = (p) => (
  <Svg mirror {...p}>
    <path d="M13.5 4.5 L4.5 13.5" />
    <path d="M15.5 6.5 L6.5 15.5" />
    <path d="M13.5 4.5 L15.5 6.5" />
    <path d="M4.5 13.5 L6.5 15.5" />
  </Svg>
)

/* A blank plate, opened. */
export const NewJob = (p) => (
  <Svg mirror {...p}>
    <path d={plate(2, 2, 16, 16)} />
    <path d="M10 6 V14" />
    <path d="M6 10 H14" />
  </Svg>
)

/* A caret resting on a rule: rename, edit in place. */
export const Amend = (p) => (
  <Svg {...p}>
    <path d="M3.5 16.5 H16.5" />
    <path d="M6 12 L10 6.5 L14 12" />
    <path d="M10 6.5 V13.5" />
  </Svg>
)

/* A record struck through. Deleting a chat removes an entry from the log — it
   is not a wastebasket, and this application has no wastebasket. Deliberately
   the inverse of NewJob: the same plate, a bar instead of a cross. */
export const Strike = (p) => (
  <Svg mirror {...p}>
    <path d={plate(2, 2, 16, 16)} />
    <path d="M5.5 10 H14.5" />
  </Svg>
)

/* FILLED (I3): retrying resumes a paid run. A square loop, hard corners. */
export const Retry = (p) => (
  <Svg mirror {...p}>
    <path d="M5 10.5 V15.5 H15.5 V4.5 H11" />
    <path d="M11.8 1.8 V7.2 L8 4.5 Z" fill="currentColor" stroke="none" />
  </Svg>
)

export const Help = (p) => (
  <Svg mirror {...p}>
    <path d="M6.5 7.5 L10 4 L13.5 7.5 L10 11 V13" />
    <path d="M10 15 V17" />
  </Svg>
)

/* ── PLAN ───────────────────────────────────────────────────────────────── */

/* A chamfered frame with a numeral slot cut from its leading edge. */
export const Scene = (p) => (
  <Svg mirror {...p}>
    <path d="M2 2 H14.5 L18 5.5 V18 H2 V12.5 H6 V7.5 H2 Z" />
    <path d="M9 8 H15" />
    <path d="M9 12 H15" />
  </Svg>
)

export const Script = (p) => (
  <Svg mirror {...p}>
    <path d={plate(2, 2, 16, 16)} />
    <path d="M5 7 H14" />
    <path d="M5 10 H14" />
    <path d="M5 13 H10.5" />
  </Svg>
)

/* FILLED (I3): generating a character preview spends credits. */
export const Character = (p) => (
  <Svg mirror {...p}>
    <path d={plate(2, 2, 16, 16)} />
    <rect x="6" y="5.5" width="5" height="5" fill="currentColor" stroke="none" />
    <path d="M6 14 H14" />
  </Svg>
)

/* FILLED (I3): generating an environment preview spends credits. */
export const Environment = (p) => (
  <Svg mirror {...p}>
    <path d={plate(2, 2, 16, 16)} />
    <path d="M4 14.5 L8 9 L10.8 12.5 L13 10 L16 14.5 Z" fill="currentColor" stroke="none" />
  </Svg>
)

/* Free: ask for the plan again. Hollow square loop, 45 degree head. */
export const Revise = (p) => (
  <Svg mirror {...p}>
    <path d="M5 10.5 V15.5 H15.5 V4.5 H11" />
    <path d="M13.5 2 L10.5 4.9 L13.5 7.8" />
  </Svg>
)

/* FILLED (I3): this is the one that authorises the spend. A struck seal. */
export const Commit = (p) => (
  <Svg mirror {...p}>
    <path d={plate(2, 2, 16, 16)} />
    <path d="M6 6 H11.5 L14 8.5 V14 H6 Z" fill="currentColor" stroke="none" />
  </Svg>
)

/* Two crossed ticks at stroke weight, on a plate: the order is voided. */
export const Void = (p) => (
  <Svg mirror {...p}>
    <path d={plate(2, 2, 16, 16)} />
    <path d="M6.5 6.5 L13.5 13.5" />
    <path d="M13.5 6.5 L6.5 13.5" />
  </Svg>
)

export const Note = (p) => (
  <Svg mirror {...p}>
    <path d={plate(2, 2, 16, 16)} />
    <path d="M10 5.5 V11" />
    <path d="M10 13 V14.8" />
  </Svg>
)

/* ── MEDIA ──────────────────────────────────────────────────────────────── */

export const ImageMark = (p) => (
  <Svg mirror {...p}>
    <path d={plate(2, 3, 16, 14)} />
    <path d="M2 14 L7 8.5 L10 12 L12.5 9.5 L18 15" />
    <path d="M12.5 6 H14.5" />
  </Svg>
)

/* A frame with two sprocket notches cut into its leading edge only. */
export const VideoMark = (p) => (
  <Svg mirror {...p}>
    <path d="M2 3 H14.5 L18 6.5 V17 H2 V14 H4.5 V12 H2 V8 H4.5 V6 H2 Z" />
    <path d="M8 7.5 L13 10 L8 12.5 Z" />
  </Svg>
)

/* A level meter, not a musical note. */
export const AudioMark = (p) => (
  <Svg {...p}>
    <path d="M3.5 8 V12" />
    <path d="M7 5 V15" />
    <path d="M10 7 V13" />
    <path d="M13 3.5 V16.5" />
    <path d="M16.5 8.5 V11.5" />
  </Svg>
)

export const Download = (p) => (
  <Svg {...p}>
    <path d="M3.5 13 V16.5 H16.5 V13" />
    <path d="M10 3 V12.5" />
    <path d="M6 8.5 L10 12.5 L14 8.5" />
  </Svg>
)

export const Expand = (p) => (
  <Svg {...p}>
    <path d="M3 8 V3 H8" />
    <path d="M17 12 V17 H12" />
    <path d="M3.5 3.5 L8.5 8.5" />
    <path d="M16.5 16.5 L11.5 11.5" />
  </Svg>
)

/* ── DATA — all five carry the tick row (I2) ────────────────────────────── */

/* A squared currency mark. Straight lines only; no calligraphic S. */
export const LedgerTick = (p) => (
  <Svg mirror {...p}>
    <path d="M13.5 5 H7.5 V9 H12.5 V13 H6.5" />
    <path d="M10 3 V15" />
    <path d={TICKS} />
  </Svg>
)

/* A square clock. There are no circles in this system. */
export const Duration = (p) => (
  <Svg mirror {...p}>
    <path d={plate(3, 2, 14, 12)} />
    <path d="M10 5 V8.5 H13.5" />
    <path d={TICKS} />
  </Svg>
)

export const Credits = (p) => (
  <Svg mirror {...p}>
    <path d="M3.5 4 H16.5 V7.5 H3.5 Z" />
    <path d="M3.5 9.5 H16.5 V13 H3.5 Z" />
    <path d={TICKS} />
  </Svg>
)

export const MeterMark = (p) => (
  <Svg mirror {...p}>
    <path d="M3.5 11.5 V14.5" />
    <path d="M7.5 8.5 V14.5" />
    <path d="M11.5 6 V14.5" />
    <path d="M15.5 3.5 V14.5" />
    <path d={TICKS} />
  </Svg>
)

export const Tokens = (p) => (
  <Svg mirror {...p}>
    <path d="M3.5 3.5 H8 V8 H3.5 Z" />
    <path d="M11 3.5 H15.5 V8 H11 Z" />
    <path d="M3.5 10 H8 V14.5 H3.5 Z" />
    <path d="M11 10 H15.5 V14.5 H11 Z" />
    <path d={TICKS} />
  </Svg>
)

/* ── SYSTEM ─────────────────────────────────────────────────────────────── */

/* A square lens with the notch, and a 45 degree handle. */
export const Search = (p) => (
  <Svg mirror {...p}>
    <path d={plate(2.5, 2.5, 10, 10, 2.5)} />
    <path d="M12.5 12.5 L17.5 17.5" />
  </Svg>
)

export const Close = (p) => (
  <Svg {...p}>
    <path d="M4.5 4.5 L15.5 15.5" />
    <path d="M15.5 4.5 L4.5 15.5" />
  </Svg>
)

/* ONE caret, rotated by CSS. Never four separate files.
   direction: 'end' (default, points along the reading direction) | 'start' |
   'up' | 'down'. */
export const Caret = ({ direction = 'end', style, ...rest }) => {
  const rtl = useRtl()
  const deg =
    direction === 'up' ? -90 :
    direction === 'down' ? 90 :
    direction === 'start' ? (rtl ? 0 : 180) :
    (rtl ? 180 : 0)
  return (
    <Svg {...rest} style={{ ...style, transform: `rotate(${deg}deg)` }}>
      <path d="M7 3.5 L13.5 10 L7 16.5" />
    </Svg>
  )
}

export const Check = (p) => (
  <Svg {...p}>
    <path d="M3.5 10 L8 14.5 L16.5 5" />
  </Svg>
)

/* ── SHELL EXTRAS — not in the core 34, but the app needs them ──────────── */

/* The rail panel toggle: the spine, and the panel beside it. */
export const Fold = (p) => (
  <Svg mirror {...p}>
    <path d={plate(2, 3, 16, 14)} />
    <path d="M7.5 3 V17" />
  </Svg>
)

/* Leaving the console: a plate opened on the inline-end, and a 45 degree exit. */
export const SignOut = (p) => (
  <Svg mirror {...p}>
    <path d="M10.5 3 H3.5 V17 H10.5" />
    <path d="M8.5 10 H17" />
    <path d="M13 6 L17 10 L13 14" />
  </Svg>
)

/* A square aperture. No lens circle, no eyelid arc. */
export const Reveal = (p) => (
  <Svg {...p}>
    <path d="M2.5 10 L10 4 L17.5 10 L10 16 Z" />
    <path d="M8.5 8.5 H11.5 V11.5 H8.5 Z" />
  </Svg>
)

export const RevealOff = (p) => (
  <Svg {...p}>
    <path d="M2.5 10 L10 4 L17.5 10 L10 16 Z" />
    <path d="M8.5 8.5 H11.5 V11.5 H8.5 Z" />
    <path d="M3 17 L17 3" />
  </Svg>
)

export const External = (p) => (
  <Svg mirror {...p}>
    <path d="M9 3.5 H3.5 V16.5 H16.5 V11" />
    <path d="M9.5 10.5 L16.5 3.5" />
    <path d="M11 3.5 H16.5 V9" />
  </Svg>
)

export const TrendUp = (p) => (
  <Svg mirror {...p}>
    <path d="M3 14.5 L8 9.5 L11 12.5 L17 6.5" />
    <path d="M12 6.5 H17 V11.5" />
  </Svg>
)

export const TrendDown = (p) => (
  <Svg mirror {...p}>
    <path d="M3 5.5 L8 10.5 L11 7.5 L17 13.5" />
    <path d="M12 13.5 H17 V8.5" />
  </Svg>
)

/* Two ID plates, overlapped. */
export const Users = (p) => (
  <Svg mirror {...p}>
    <path d="M7.5 3.5 H17.5 V13" />
    <path d={plate(2.5, 6.5, 12, 10, 2.5)} />
    <path d="M5 9.5 H8 V12.5 H5 Z" />
    <path d="M10 10 H13.5" />
    <path d="M5 14.5 H13.5" />
  </Svg>
)

export const Filter = (p) => (
  <Svg {...p}>
    <path d="M3 5.5 H17" />
    <path d="M5.5 10 H14.5" />
    <path d="M8 14.5 H12" />
  </Svg>
)

/* ── STATE SHAPES (L4) ──────────────────────────────────────────────────────
   Shape carries the meaning; hue is the second channel, never the first. A
   colourblind user reads run state from these alone. Drawn on a 10px grid,
   rendered at 10px inside <StatusMarker>. */

export const ShapeDone = ({ size = 10, className = '', ...rest }) => (
  <svg viewBox="0 0 10 10" width={size} height={size} className={`wz-icon${className ? ' ' + className : ''}`} aria-hidden="true" focusable="false" {...rest}>
    <rect x="1" y="1" width="8" height="8" fill="currentColor" />
  </svg>
)

export const ShapeFail = ({ size = 10, className = '', ...rest }) => (
  <svg viewBox="0 0 10 10" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="butt" className={`wz-icon${className ? ' ' + className : ''}`} aria-hidden="true" focusable="false" {...rest}>
    <path d="M1.4 1.4 L8.6 8.6" />
    <path d="M8.6 1.4 L1.4 8.6" />
  </svg>
)

export const ShapeRun = ({ size = 10, className = '', ...rest }) => (
  <svg viewBox="0 0 10 10" width={size} height={size} className={`wz-icon${className ? ' ' + className : ''}`} aria-hidden="true" focusable="false" {...rest}>
    <rect x="1.2" y="1.2" width="7.6" height="7.6" fill="none" stroke="currentColor" strokeWidth={1.4} />
    <rect x="1.9" y="1.9" width="6.2" height="3.1" fill="currentColor" />
  </svg>
)

export const ShapeQueued = ({ size = 10, className = '', ...rest }) => (
  <svg viewBox="0 0 10 10" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.4} className={`wz-icon${className ? ' ' + className : ''}`} aria-hidden="true" focusable="false" {...rest}>
    <rect x="1.2" y="1.2" width="7.6" height="7.6" />
  </svg>
)

export const ShapeCancelled = ({ size = 10, className = '', ...rest }) => (
  <svg viewBox="0 0 10 10" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="butt" className={`wz-icon${className ? ' ' + className : ''}`} aria-hidden="true" focusable="false" {...rest}>
    <rect x="1.2" y="1.2" width="7.6" height="7.6" />
    <path d="M0.6 9.4 L9.4 0.6" />
  </svg>
)
