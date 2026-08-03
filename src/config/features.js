/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE FLAGS

   One place. Read them from here, never from import.meta.env directly, so
   every gated surface can be found with one grep.
   ═══════════════════════════════════════════════════════════════════════════ */

/* CREDITS — the balance, the top-bar figure, the "balance after this run"
   line on the commit gate, the billing route and the top-up flow.

   OFF BY DEFAULT, ON PURPOSE. The backend already enforces credits
   (`has_enough_credits` gates POST /generate, and `deduct_credits_for_run`
   debits at 20 credits per USD), and a half-tested balance in the UI would
   interrupt a test run with an out-of-credit stop. So the whole credit
   surface is built and wired but hidden until it is deliberately switched on.

   Backend note, so nobody hunts for it later: users with role TESTER or ADMIN
   are already skipped by the deduction path, so testing on such an account
   never spends anything regardless of this flag.

   TO TURN IT ON: set VITE_CREDITS_ENABLED=true in Frontend/.env (and in the
   docker-compose build args for the container build), then rebuild. Nothing
   else needs to change — every gated surface reads this constant. */
export const CREDITS_ENABLED = import.meta.env.VITE_CREDITS_ENABLED === 'true'

/* 20 credits = $1. Mirrors CREDITS_PER_USD in the backend settings
   (db/repositories/credits_repo.py). If the backend value changes this MUST
   change with it, or the "balance after this run" figure silently lies. */
export const CREDITS_PER_USD = 20

/** Cost in USD as the credits actually debited. The backend charges
 *  `max(1, ceil(usd * CREDITS_PER_USD))`, so the UI mirrors it exactly rather
 *  than rounding its own way and disagreeing with the receipt. */
export function usdToCredits(usd) {
  const n = Number(usd)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.max(1, Math.ceil(n * CREDITS_PER_USD))
}
