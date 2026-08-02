/* ═══════════════════════════════════════════════════════════════════════════
   RUN STATUS — how the status bar learns about the live run WITHOUT touching
   a store.

   The machine's state and its cost belong permanently on screen, not inside a
   chat message that scrolls away. But behaviour is frozen: no store may gain
   state, no service may change, no socket handler may be rewritten.

   So this is a presentation-layer channel. ChatPage publishes the local state
   it ALREADY has — the values `openRunSocket`'s onmessage already parses out
   of the payload (data.progress, data.scene_number, data.message) — and the
   status bar reads them. `patchMessage(progressTargetRef.current, ...)` keeps
   running exactly as it does: the transcript still receives its progress line.
   The status bar is an ADDITIONAL reader of the same data, never a replacement.

   USAGE — in ChatPage, publish whenever the values you already track change:

     import { useRunStatus } from '../components/RunStatusContext'
     const { publish, clear } = useRunStatus()

     useEffect(() => {
       publish({ activeRunId, loading, awaitingUser, phase, percent,
                 sceneNumber, elapsedMs, sessionCostUsd })
     }, [activeRunId, loading, awaitingUser, phase, percent, sceneNumber,
         elapsedMs, sessionCostUsd, publish])

     // when the run resolves
     useEffect(() => () => clear(), [clear])

   `publish` and `clear` are stable identities — safe in a dependency array.
   Partial patches are fine; publish({ percent: 0.4 }) leaves everything else.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const EMPTY = {
  activeRunId: null,     // number | null — a run is live when this is set
  loading: false,        // bool
  awaitingUser: false,   // bool — the plan card is waiting on a decision
  phase: null,           // string — the human phase legend, already localised
  percent: null,         // 0..1 — from data.progress
  sceneNumber: null,     // number — from data.scene_number
  elapsedMs: null,       // number — local Date.now() delta since the run began
  sessionCostUsd: 0,     // number — accumulates plan.total_cost_usd per confirm
}

const RunStatusContext = createContext(null)

export function RunStatusProvider({ children }) {
  const [status, setStatus] = useState(EMPTY)

  const publish = useCallback((patch) => {
    setStatus((prev) => {
      if (!patch) return prev
      let changed = false
      for (const k of Object.keys(patch)) {
        if (prev[k] !== patch[k]) { changed = true; break }
      }
      return changed ? { ...prev, ...patch } : prev
    })
  }, [])

  const clear = useCallback(() => setStatus(EMPTY), [])

  const value = useMemo(() => ({ status, publish, clear }), [status, publish, clear])

  return <RunStatusContext.Provider value={value}>{children}</RunStatusContext.Provider>
}

/* Safe outside the provider (the auth routes render no shell), so a component
   can call it unconditionally. */
export function useRunStatus() {
  const ctx = useContext(RunStatusContext)
  return ctx || { status: EMPTY, publish: () => {}, clear: () => {} }
}

export default RunStatusContext
