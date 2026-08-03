/* ── RUN STATE, AS A FIELD ─────────────────────────────────────────────────
   Principle 5: status is a field, not an event. A word in a column, in a
   muted semantic tone, with the 7px dot .st draws for it. No pill, no tinted
   chip, no glyph set to learn, and the one permitted motion in the system —
   the breathing dot on --run — comes from .st--run itself.

   THE FILTER LIST IS THE REAL ENUM. It used to read
   [all, completed, failed, running, pending], but the backend enum
   (Backend/db/utils/enums.py RunStatus) emits
   pending | running | awaiting_clarification | awaiting_confirmation |
   cancelled | succeeded | failed. "completed" matched nothing, so choosing
   "Completed" in the status filter reliably emptied the table. The canonical
   list below is the enum; the alias map keeps older rows that carry
   completed / success / error / queued readable.

   Lives here rather than in the table because the drawer states the same
   thing about the same run and the two must not drift. */

import React from 'react'
import { useUIStore } from '../../store/uiStore'

/* status → .st tone. Only four tones exist: ok, run, bad, idle. */
const TONE = {
  succeeded: 'ok', completed: 'ok', success: 'ok',
  failed: 'bad', error: 'bad',
  running: 'run', in_progress: 'run',
  pending: 'idle', queued: 'idle',
  cancelled: 'idle', canceled: 'idle',
  awaiting_clarification: 'idle', awaiting_confirmation: 'idle',
}

const WORD = {
  succeeded: ['مكتمل', 'Succeeded'],
  completed: ['مكتمل', 'Completed'],
  success: ['مكتمل', 'Success'],
  failed: ['فاشل', 'Failed'],
  error: ['خطأ', 'Error'],
  running: ['قيد التنفيذ', 'Running'],
  in_progress: ['قيد التنفيذ', 'In progress'],
  pending: ['في الانتظار', 'Pending'],
  queued: ['في الانتظار', 'Queued'],
  cancelled: ['ملغى', 'Cancelled'],
  canceled: ['ملغى', 'Cancelled'],
  awaiting_clarification: ['بانتظار توضيح', 'Awaiting clarification'],
  awaiting_confirmation: ['بانتظار تأكيد', 'Awaiting confirmation'],
}

/* The seven states the API can actually return, in pipeline order. Anything
   the filter offers must be able to match a row — a control that cannot
   produce a result is a dead control. */
export const STATUS_FILTERS = [
  'pending',
  'running',
  'awaiting_clarification',
  'awaiting_confirmation',
  'succeeded',
  'failed',
  'cancelled',
]

export function statusKey(status) {
  return String(status ?? '').toLowerCase()
}

export function statusTone(status) {
  return TONE[statusKey(status)] || 'idle'
}

/* A3: an unrecognised status is a raw Latin token from the API. Inside an
   Arabic run it has to be isolated or the bidi algorithm drags it around, so
   the fallback is set in .mono and the known words are not. */
export function StatusWord({ status }) {
  const ar = useUIStore((s) => s.language) === 'ar'
  const key = statusKey(status)
  const pair = WORD[key]
  if (pair) return <>{ar ? pair[0] : pair[1]}</>
  if (!key) return <>—</>
  return <span className="mono">{key}</span>
}

export function statusLabel(status, ar) {
  const pair = WORD[statusKey(status)]
  if (pair) return ar ? pair[0] : pair[1]
  return statusKey(status) || '—'
}

export default function RunStatusField({ status, style }) {
  return (
    <span className={`st st--${statusTone(status)}`} style={style}>
      <StatusWord status={status} />
    </span>
  )
}
