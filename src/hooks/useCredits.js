/* ═══════════════════════════════════════════════════════════════════════════
   useCredits — the account's credit balance.

   The backend has had this the whole time and the frontend never called it:
   GET /users/me/credits returns { credits }, and paymentService.js was in the
   repository unimported. The practical consequence was that a customer found
   out they were out of credit by pressing Commit and failing.

   GATED. When CREDITS_ENABLED is false this hook makes NO request and returns
   credits: null, so a test run cannot be interrupted by a balance the product
   is not ready to enforce yet. Every consumer must also gate its own UI on
   CREDITS_ENABLED — this hook going quiet is not a substitute for that.

   Backend unit: credits, integer. 20 credits = $1 (CREDITS_PER_USD). Runs are
   charged max(1, ceil(usd * 20)) and users with role TESTER or ADMIN are never
   charged at all.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from 'react'
import { paymentService } from '../services/paymentService'
import { CREDITS_ENABLED } from '../config/features'
import { useAuthStore } from '../store/authStore'

export function useCredits() {
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  const [credits, setCredits] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!CREDITS_ENABLED || !isAuthed) return
    setLoading(true)
    setError(null)
    try {
      const data = await paymentService.getCredits()
      setCredits(Number(data?.credits ?? 0))
    } catch (err) {
      /* A balance that fails to load must never block the app. It renders as
         unknown and the run goes ahead; the backend is the authority on
         whether a spend is allowed, not this number. */
      setError(err)
      setCredits(null)
    } finally {
      setLoading(false)
    }
  }, [isAuthed])

  useEffect(() => { refresh() }, [refresh])

  return { credits, loading, error, refresh, enabled: CREDITS_ENABLED }
}

export default useCredits
