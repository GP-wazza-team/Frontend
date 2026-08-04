/* ═══════════════════════════════════════════════════════════════════════════
   WAZZA — THE ICON SET

   These are SUPPORTING marks. The navigation carries words, so no icon here
   has to encode meaning on its own. Each one draws the CONVENTIONAL form of
   its concept — the shape a user already knows from every other competent
   product — so it is recognised in under a second with no training. If a mark
   could sit unchanged in Frame.io, YouTube Studio or Premiere, that is the
   correct outcome. Legibility beats novelty for a functional icon set.

   HOUSE STYLE — applies to every mark, no exceptions.
     · 20 x 20 viewBox. Geometry snaps to a 2px sub-grid where it can.
     · fill="none", stroke="currentColor", stroke-width 1.6.
     · stroke-linecap ROUND, stroke-linejoin ROUND. The system uses a 10px/6px
       corner radius everywhere; the icons agree with it rather than fighting
       it. This is the single rule that keeps the set from reading as a
       cockpit HUD.
     · Rectangular bodies carry a 2–3px corner radius. No chamfers, no cut
       corners, no notches anywhere.
     · Consistent optical weight, roughly 16 x 16 of live area inside the
       20 x 20 box, every mark optically centred.
     · Monochrome outline. No two-tone, no accent fill, no filled variants.
       Emphasis comes from colour and placement, set by the caller.

   WHAT WAS DELETED, AND WHY
     · THE NOTCH — a 3.5px 45° chamfer on every plate-bodied mark. It was a
       private symbol and it is what made the set read as faction UI. Gone.
     · THE TICK ROW — three ticks along the bottom edge of any "quantitative"
       mark. It encoded a distinction no user ever decoded. Gone.
     · FILL IS MONEY — marks drawn solid only when the action spent credits.
       A filled icon reads as "selected" to everyone on earth, not as "costs
       money". Gone; every mark is now a consistent outline.

   RTL
     `useRtl()` reports the current direction from the language store, and
     App.jsx drives html[dir] from the same value. Genuinely directional marks
     carry `mirror`, which adds `.wz-icon--flip`; the stylesheet flips those
     under [dir=rtl]. Non-directional marks never flip — a magnifier, a clock,
     a gear, a trend line and a play triangle read the same in both
     directions, and flipping them is a bug, not a courtesy.
     `Caret` is the exception: it rotates rather than flips, so it computes
     its own angle from `useRtl()`.

   USAGE
     import { Chat, Ledger, Close } from '../components/Icon'
     <Chat size={16} />                      // size defaults to 16
     <Caret size={16} direction="down" />    // the only rotatable mark
     Colour comes from `currentColor`. Set it on the parent, or pass
     className="text-[var(--ink-3)]" / style={{ color: 'var(--ink-3)' }}.

   SIZES  16px in dense rows and controls · 20px in the rail spine ·
          14px inside a 24px action bar · 10px for the status shapes.
   ═══════════════════════════════════════════════════════════════════════════ */

import React from 'react'
import { useUIStore } from '../store/uiStore'

/* The direction the marks are stamped for. App.jsx drives html[dir] from this
   same value, so a mirrored mark can never disagree with its container. */
export function useRtl() {
  return useUIStore((s) => s.language === 'ar')
}

function Svg({ size = 16, className = '', mirror = false, children, ...rest }) {
  const cls = `wz-icon${mirror ? ' wz-icon--flip' : ''}${className ? ' ' + className : ''}`
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

/* ── NAVIGATION ─────────────────────────────────────────────────────────── */

/* Speech bubble with a tail. Mirrored: the tail follows the reading side. */
export const Chat = (p) => (
  <Svg mirror {...p}>
    <path d="M17 11.5 A2.5 2.5 0 0 1 14.5 14 H10.5 L6.5 17 V14 H5.5 A2.5 2.5 0 0 1 3 11.5 V6 A2.5 2.5 0 0 1 5.5 3.5 H14.5 A2.5 2.5 0 0 1 17 6 Z" />
  </Svg>
)

/* The dashboard. A bar chart on a baseline — the universal analytics mark. */
export const Ledger = (p) => (
  <Svg {...p}>
    <path d="M3 16.5 H17" />
    <path d="M6.5 16.5 V10" />
    <path d="M10 16.5 V4.5" />
    <path d="M13.5 16.5 V7.5" />
  </Svg>
)

/* The asset library. A stack of pictures. */
export const Library = (p) => (
  <Svg mirror {...p}>
    <path d="M6 3.5 H15.5 A1.5 1.5 0 0 1 17 5 V14.5" />
    <rect x="2.5" y="6" width="12" height="11" rx="2" />
    <path d="M2.6 14.6 L6.6 10.6 L9.2 13.2 L11 11.4 L14.4 14.8" />
  </Svg>
)

/* The admin console. A shield. */
export const Admin = (p) => (
  <Svg {...p}>
    <path d="M10 2.8 L16.5 5.3 V10.2 Q16.5 15.2 10 17.3 Q3.5 15.2 3.5 10.2 V5.3 Z" />
  </Svg>
)

/* Settings. A gear — hub, ring, six teeth. */
export const Settings = (p) => (
  <Svg {...p}>
    <circle cx="10" cy="10" r="2.4" />
    <circle cx="10" cy="10" r="5" />
    <path d="M15 10 H17.2" />
    <path d="M12.5 5.67 L13.6 3.77" />
    <path d="M7.5 5.67 L6.4 3.77" />
    <path d="M5 10 H2.8" />
    <path d="M7.5 14.33 L6.4 16.23" />
    <path d="M12.5 14.33 L13.6 16.23" />
  </Svg>
)

/* ── THE BRAND MARK ─────────────────────────────────────────────────────── */

/* A rounded square with one rule across it: the jadwal, the ruled line of a
   set page, and the only line this system permits. Monochrome — it takes
   currentColor and nothing else.

   NOTE: this used to be a CHAMFERED square (a 3.5px corner cut). The chamfer
   is gone along with the rest of the notch doctrine, so public/favicon.svg —
   which still draws the cut corner and butt caps — no longer matches this
   file and needs the same treatment: rx 3.2, stroke-width 1.6, round caps
   and joins. */
export const Mark = ({ size = 20, className = '', ...rest }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`wz-icon${className ? ' ' + className : ''}`}
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    <rect x="2.8" y="2.8" width="14.4" height="14.4" rx="3.2" />
    <path d="M2.8 12.4 H17.2" />
  </svg>
)

/* ── RAIL ───────────────────────────────────────────────────────────────── */

/* The account. A person. */
export const Account = (p) => (
  <Svg {...p}>
    <circle cx="10" cy="7" r="3.3" />
    <path d="M4 17 A6.25 6.25 0 0 1 16 17" />
  </Svg>
)

/* Appearance. A crescent moon. */
export const Theme = (p) => (
  <Svg {...p}>
    <path d="M17.17 10.66 A7.2 7.2 0 1 1 9.34 2.83 A5.6 5.6 0 0 0 17.17 10.66 Z" />
  </Svg>
)

/* Language. A globe. */
export const Language = (p) => (
  <Svg {...p}>
    <circle cx="10" cy="10" r="7.2" />
    <path d="M2.8 10 H17.2" />
    <ellipse cx="10" cy="10" rx="3.1" ry="7.2" />
  </Svg>
)

/* ── CHAT ───────────────────────────────────────────────────────────────── */

/* A paper plane. Directional, so it mirrors. */
export const Send = (p) => (
  <Svg mirror {...p}>
    <path d="M17.5 2.5 L2.5 9.3 L9.1 11.6 L11.5 17.5 Z" />
    <path d="M17.5 2.5 L9.1 11.6" />
  </Svg>
)

/* A paperclip. */
export const Attach = (p) => (
  <Svg {...p}>
    <path d="M17.47 9.44 l-7.35 7.35 a4.8 4.8 0 0 1 -6.79 -6.79 l7.35 -7.35 a3.2 3.2 0 0 1 4.53 4.53 l-7.36 7.35 a1.6 1.6 0 0 1 -2.26 -2.26 l6.79 -6.78" />
  </Svg>
)

/* New. A plus. */
export const NewJob = (p) => (
  <Svg {...p}>
    <path d="M10 4.2 V15.8" />
    <path d="M4.2 10 H15.8" />
  </Svg>
)

/* Rename / edit in place. A pencil. Handed, so it mirrors. */
export const Amend = (p) => (
  <Svg mirror {...p}>
    <path d="M3.7 16.8 L4.6 13.5 L14.1 4 L16.5 6.4 L7 15.9 Z" />
    <path d="M12.1 6 L14.5 8.4" />
  </Svg>
)

/* Delete. A wastebasket. (Was a struck record — same meaning, conventional
   drawing.) */
export const Strike = (p) => (
  <Svg {...p}>
    <path d="M3.6 5.4 H16.4" />
    <path d="M8 5.4 V4 A1 1 0 0 1 9 3 H11 A1 1 0 0 1 12 4 V5.4" />
    <path d="M5.5 5.4 V15.6 A1.6 1.6 0 0 0 7.1 17.2 H12.9 A1.6 1.6 0 0 0 14.5 15.6 V5.4" />
  </Svg>
)

/* Retry. A single counter-clockwise arrow — "run it again". */
export const Retry = (p) => (
  <Svg {...p}>
    <path d="M2 3.6 V8.4 H6.8" />
    <path d="M4.01 12.4 A7.2 7.2 0 1 0 5.71 4.91 L2 8.4" />
  </Svg>
)

/* Help. A question mark in a circle. */
export const Help = (p) => (
  <Svg {...p}>
    <circle cx="10" cy="10" r="7.2" />
    <path d="M7.7 8 A2.3 2.3 0 1 1 10 11 V12.3" />
    <path d="M10 14.6 V14.61" />
  </Svg>
)

/* ── PLAN ───────────────────────────────────────────────────────────────── */

/* A scene. A three-panel storyboard strip. */
export const Scene = (p) => (
  <Svg {...p}>
    <rect x="2.6" y="4.6" width="14.8" height="10.8" rx="2" />
    <path d="M7.5 4.6 V15.4" />
    <path d="M12.5 4.6 V15.4" />
  </Svg>
)

/* The script. A document with a folded corner and ruled lines. */
export const Script = (p) => (
  <Svg mirror {...p}>
    <path d="M11.2 2.8 H6 A2 2 0 0 0 4 4.8 V15.2 A2 2 0 0 0 6 17.2 H14 A2 2 0 0 0 16 15.2 V7.6 Z" />
    <path d="M11.2 2.8 V6.6 A1 1 0 0 0 12.2 7.6 H16" />
    <path d="M6.8 11 H13.2" />
    <path d="M6.8 13.8 H13.2" />
  </Svg>
)

/* A character. A portrait in a frame. */
export const Character = (p) => (
  <Svg {...p}>
    <rect x="2.8" y="2.8" width="14.4" height="14.4" rx="3" />
    <circle cx="10" cy="8.2" r="2.2" />
    <path d="M5.9 15.6 A4.6 4.6 0 0 1 14.1 15.6" />
  </Svg>
)

/* A sketch. A pen nib drawing a stroke — the mark being MADE, which is what
   separates it from Attach (a clip holding a finished thing). */
export const Sketch = (p) => (
  <Svg mirror {...p}>
    <path d="M13.4 3.6 A1.9 1.9 0 0 1 16.4 6.6 L7.9 15.1 L4.4 15.6 L4.9 12.1 Z" />
    <path d="M11.6 5.4 L14.6 8.4" />
    <path d="M3.2 17.6 H10" />
  </Svg>
)

/* An environment. A landscape. */
export const Environment = (p) => (
  <Svg {...p}>
    <path d="M2.8 15.6 L7.4 8.6 L11 13.4 L13.2 10.6 L17.2 15.6" />
    <circle cx="14.4" cy="5.4" r="1.9" />
  </Svg>
)

/* Revise / reload. The two-arrow refresh loop. Distinct from Retry, which is
   one arrow going the other way. */
export const Revise = (p) => (
  <Svg {...p}>
    <path d="M17.7 4.4 V8.6 H13.5" />
    <path d="M2.3 15.6 V11.4 H6.5" />
    <path d="M4.06 7.9 A6.3 6.3 0 0 1 14.46 5.55 L17.7 8.6" />
    <path d="M2.3 11.4 L5.55 14.45 A6.3 6.3 0 0 0 15.94 12.1" />
  </Svg>
)

/* Commit — the action that authorises the spend. A check in a circle. */
export const Commit = (p) => (
  <Svg {...p}>
    <circle cx="10" cy="10" r="7.2" />
    <path d="M6.6 10.2 L8.9 12.5 L13.5 7.6" />
  </Svg>
)

/* Cancel / void. An X in a circle — distinct from Close, which is a bare X. */
export const Void = (p) => (
  <Svg {...p}>
    <circle cx="10" cy="10" r="7.2" />
    <path d="M7.3 7.3 L12.7 12.7" />
    <path d="M12.7 7.3 L7.3 12.7" />
  </Svg>
)

/* A note. The information mark. */
export const Note = (p) => (
  <Svg {...p}>
    <circle cx="10" cy="10" r="7.2" />
    <path d="M10 9.4 V13.6" />
    <path d="M10 6.6 V6.61" />
  </Svg>
)

/* ── MEDIA ──────────────────────────────────────────────────────────────── */

/* A photograph. */
export const ImageMark = (p) => (
  <Svg {...p}>
    <rect x="2.8" y="3.6" width="14.4" height="12.8" rx="2.4" />
    <circle cx="6.8" cy="7.6" r="1.4" />
    <path d="M3 16 L8.4 10.6 L11.8 14 L13.8 12 L17 15.2" />
  </Svg>
)

/* A video. Play, in a frame. Playback marks are never mirrored. */
export const VideoMark = (p) => (
  <Svg {...p}>
    <rect x="2.8" y="4" width="14.4" height="12" rx="2.4" />
    <path d="M8.4 7.6 L13.4 10 L8.4 12.4 Z" />
  </Svg>
)

/* Audio. A waveform. */
export const AudioMark = (p) => (
  <Svg {...p}>
    <path d="M3.4 8.6 V11.4" />
    <path d="M6.7 5.8 V14.2" />
    <path d="M10 7.4 V12.6" />
    <path d="M13.3 4.6 V15.4" />
    <path d="M16.6 8.6 V11.4" />
  </Svg>
)

export const Download = (p) => (
  <Svg {...p}>
    <path d="M10 3.2 V13.4" />
    <path d="M6.2 9.6 L10 13.4 L13.8 9.6" />
    <path d="M3.6 14.2 V15.6 A1.6 1.6 0 0 0 5.2 17.2 H14.8 A1.6 1.6 0 0 0 16.4 15.6 V14.2" />
  </Svg>
)

/* Expand to full size. Four corner brackets. */
export const Expand = (p) => (
  <Svg {...p}>
    <path d="M7.6 2.8 H4.4 A1.6 1.6 0 0 0 2.8 4.4 V7.6" />
    <path d="M12.4 2.8 H15.6 A1.6 1.6 0 0 1 17.2 4.4 V7.6" />
    <path d="M17.2 12.4 V15.6 A1.6 1.6 0 0 1 15.6 17.2 H12.4" />
    <path d="M7.6 17.2 H4.4 A1.6 1.6 0 0 1 2.8 15.6 V12.4" />
  </Svg>
)

/* ── DATA ───────────────────────────────────────────────────────────────── */

/* Money. A currency mark. */
export const LedgerTick = (p) => (
  <Svg {...p}>
    <path d="M13.4 6.6 C13.4 5.1 11.9 4.2 10 4.2 C8.1 4.2 6.6 5.1 6.6 6.6 C6.6 8.2 8.1 8.9 10 9.4 C11.9 9.9 13.4 10.7 13.4 12.3 C13.4 13.8 11.9 14.7 10 14.7 C8.1 14.7 6.6 13.8 6.6 12.3" />
    <path d="M10 2.6 V17.4" />
  </Svg>
)

/* Elapsed time. A clock. */
export const Duration = (p) => (
  <Svg {...p}>
    <circle cx="10" cy="10" r="7.2" />
    <path d="M10 5.8 V10 H13.4" />
  </Svg>
)

/* Credits on the account. A card. */
export const Credits = (p) => (
  <Svg {...p}>
    <rect x="2.6" y="4.6" width="14.8" height="10.8" rx="2.2" />
    <path d="M2.6 8.4 H17.4" />
  </Svg>
)

/* A reading against a scale. A gauge. */
export const MeterMark = (p) => (
  <Svg {...p}>
    <path d="M3.5 13.75 A6.6 6.6 0 1 1 16.5 13.75" />
    <path d="M10 12.6 L14 8.6" />
  </Svg>
)

/* Tokens. Counted units. */
export const Tokens = (p) => (
  <Svg {...p}>
    <rect x="3.2" y="3.2" width="6" height="6" rx="1.6" />
    <rect x="10.8" y="3.2" width="6" height="6" rx="1.6" />
    <rect x="3.2" y="10.8" width="6" height="6" rx="1.6" />
    <rect x="10.8" y="10.8" width="6" height="6" rx="1.6" />
  </Svg>
)

/* ── SYSTEM ─────────────────────────────────────────────────────────────── */

/* A magnifier. Never mirrored — the search glyph is the same in both
   directions and flipping it only makes it look wrong. */
export const Search = (p) => (
  <Svg {...p}>
    <circle cx="8.8" cy="8.8" r="5.4" />
    <path d="M12.7 12.7 L16.8 16.8" />
  </Svg>
)

export const Close = (p) => (
  <Svg {...p}>
    <path d="M5.2 5.2 L14.8 14.8" />
    <path d="M14.8 5.2 L5.2 14.8" />
  </Svg>
)

/* ONE chevron, rotated. It rotates rather than flips, so it takes its angle
   from the direction directly.
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
      <path d="M7.6 4 L13.4 10 L7.6 16" />
    </Svg>
  )
}

export const Check = (p) => (
  <Svg {...p}>
    <path d="M4.4 10.4 L8.2 14.2 L15.6 5.8" />
  </Svg>
)

/* ── SHELL ──────────────────────────────────────────────────────────────── */

/* The rail toggle. A panel with its sidebar column. Directional. */
export const Fold = (p) => (
  <Svg mirror {...p}>
    <rect x="2.8" y="3.6" width="14.4" height="12.8" rx="2.4" />
    <path d="M8 3.6 V16.4" />
  </Svg>
)

/* Sign out. A door and an arrow leaving through it. Directional. */
export const SignOut = (p) => (
  <Svg mirror {...p}>
    <path d="M12 16.6 H5.2 A1.8 1.8 0 0 1 3.4 14.8 V5.2 A1.8 1.8 0 0 1 5.2 3.4 H12" />
    <path d="M8.2 10 H16.6" />
    <path d="M13.2 6.6 L16.6 10 L13.2 13.4" />
  </Svg>
)

/* Reveal the password. An eye. */
export const Reveal = (p) => (
  <Svg {...p}>
    <path d="M2 10 s2.91 -5.82 8 -5.82 s8 5.82 8 5.82 s-2.91 5.82 -8 5.82 s-8 -5.82 -8 -5.82 Z" />
    <circle cx="10" cy="10" r="2.18" />
  </Svg>
)

export const RevealOff = (p) => (
  <Svg {...p}>
    <path d="M2 10 s2.91 -5.82 8 -5.82 s8 5.82 8 5.82 s-2.91 5.82 -8 5.82 s-8 -5.82 -8 -5.82 Z" />
    <circle cx="10" cy="10" r="2.18" />
    <path d="M3.4 16.6 L16.6 3.4" />
  </Svg>
)

/* Opens outside the app. Directional. */
export const External = (p) => (
  <Svg mirror {...p}>
    <path d="M10.6 3.8 H5.2 A1.4 1.4 0 0 0 3.8 5.2 V14.8 A1.4 1.4 0 0 0 5.2 16.2 H14.8 A1.4 1.4 0 0 0 16.2 14.8 V9.4" />
    <path d="M12.6 3.4 H16.6 V7.4" />
    <path d="M9.6 10.4 L16.6 3.4" />
  </Svg>
)

/* Trend marks are NOT mirrored. They read as miniature charts, and the charts
   they sit beside (Recharts) always plot left to right in both directions —
   a flipped arrow beside an unflipped chart is the wrong answer. */
export const TrendUp = (p) => (
  <Svg {...p}>
    <path d="M3.2 14.6 L8 9.8 L11 12.8 L16.8 7" />
    <path d="M12.4 7 H16.8 V11.4" />
  </Svg>
)

export const TrendDown = (p) => (
  <Svg {...p}>
    <path d="M3.2 5.4 L8 10.2 L11 7.2 L16.8 13" />
    <path d="M12.4 13 H16.8 V8.6" />
  </Svg>
)

/* People. */
export const Users = (p) => (
  <Svg mirror {...p}>
    <path d="M13.64 16.55 V15.09 A2.91 2.91 0 0 0 10.73 12.18 H4.91 A2.91 2.91 0 0 0 2 15.09 V16.55" />
    <circle cx="7.82" cy="6.36" r="2.91" />
    <path d="M17.99 16.55 V15.09 A2.91 2.91 0 0 0 15.81 12.28" />
    <path d="M12.91 3.55 A2.91 2.91 0 0 1 12.91 9.19" />
  </Svg>
)

/* A funnel. */
export const Filter = (p) => (
  <Svg {...p}>
    <path d="M3.2 4.6 H16.8 L11.4 11.2 V16.2 L8.6 14.4 V11.2 Z" />
  </Svg>
)

/* ── STATUS SHAPES ──────────────────────────────────────────────────────────
   Rendered at 10px inside <StatusMarker>. Shape carries the meaning; hue is
   the second channel, never the first — a colourblind user, or anyone looking
   at a greyscale print, reads run state from these alone.

   The three circular states form a fill ramp, which is why they are legible
   as a set: QUEUED is an empty ring, RUN is a ring with its trailing half
   solid, DONE is a solid disc. Nothing → half → full. The two failure states
   are deliberately NOT on that ramp: CANCELLED is a ring with a bar struck
   through it, and FAIL has no ring at all — it is two crossing strokes, the
   only mark in the set with no round outline. So at 10px the five silhouettes
   are: solid disc · half-solid ring · empty ring · barred ring · bare cross.
   These are the one place the set is allowed a solid fill, because at 10px
   solidity is the only difference that survives.

   Verified by eye at 10px in the browser: no. Verified geometrically — the
   five silhouettes differ in ink coverage and in outline presence, which are
   the two properties that survive downscaling. Worth one look on a real
   screen before shipping. */

export const ShapeDone = ({ size = 10, className = '', ...rest }) => (
  <svg viewBox="0 0 10 10" width={size} height={size} className={`wz-icon${className ? ' ' + className : ''}`} aria-hidden="true" focusable="false" {...rest}>
    <circle cx="5" cy="5" r="4" fill="currentColor" />
  </svg>
)

export const ShapeFail = ({ size = 10, className = '', ...rest }) => (
  <svg viewBox="0 0 10 10" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className={`wz-icon${className ? ' ' + className : ''}`} aria-hidden="true" focusable="false" {...rest}>
    <path d="M1.7 1.7 L8.3 8.3" />
    <path d="M8.3 1.7 L1.7 8.3" />
  </svg>
)

export const ShapeRun = ({ size = 10, className = '', ...rest }) => (
  <svg viewBox="0 0 10 10" width={size} height={size} className={`wz-icon${className ? ' ' + className : ''}`} aria-hidden="true" focusable="false" {...rest}>
    <circle cx="5" cy="5" r="3.5" fill="none" stroke="currentColor" strokeWidth={1.3} />
    <path d="M5 2.2 A2.8 2.8 0 0 1 5 7.8 Z" fill="currentColor" stroke="none" />
  </svg>
)

export const ShapeQueued = ({ size = 10, className = '', ...rest }) => (
  <svg viewBox="0 0 10 10" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.3} className={`wz-icon${className ? ' ' + className : ''}`} aria-hidden="true" focusable="false" {...rest}>
    <circle cx="5" cy="5" r="3.5" />
  </svg>
)

export const ShapeCancelled = ({ size = 10, className = '', ...rest }) => (
  <svg viewBox="0 0 10 10" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" className={`wz-icon${className ? ' ' + className : ''}`} aria-hidden="true" focusable="false" {...rest}>
    <circle cx="5" cy="5" r="3.5" />
    <path d="M2.53 7.47 L7.47 2.53" />
  </svg>
)
