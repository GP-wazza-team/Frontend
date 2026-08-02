/* ═══════════════════════════════════════════════════════════════════════════
   THE CLARIFICATION CARD

   Shown when the prompt enhancer flagged details it would otherwise have to
   guess (hair colour, clothing, setting, time of day). Each question offers two
   suggested answers, but free text always wins — the backend merges whatever
   string it receives straight into the spec.

   RECOMPOSED: the suggestion chips were a filled-pill row, the one costume the
   system deletes everywhere. They are now a ROCKER — one etched housing, the
   selected cell raised and inked, never an accent fill. Clicking the selected
   cell again still clears it, so a mis-click is still not permanent.

   NOTHING HERE IS FILLED. Answering questions does not spend credits, so
   Continue is a text action (L1). The card carries no filled element at all.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react'
import { Help, Caret, Void } from '../Icon'
import Meter from '../ui/Meter'
import { useChatText } from './chatKit'

function ClarificationCard({ questions, resolved, resolution, busy, onSubmit, onCancel }) {
  const [answers, setAnswers] = useState({})
  const { tx } = useChatText()
  const disabled = resolved || busy

  // Answers are held BY POSITION, not by q.key.
  //
  // `needs_clarification` comes straight out of the enhancer LLM with no
  // uniqueness check on the server, so two questions can arrive carrying the
  // same key — or none at all. Keyed by q.key, those questions shared one slot
  // in this object: answering "Brown" to the hair question wrote it into the
  // time-of-day question's free-text box, and clearing one cleared the other.
  // Position is the only identity a question here is guaranteed to have.
  const setAnswer = (index, answer) => {
    setAnswers((prev) => ({ ...prev, [index]: answer }))
  }

  // Clicking the selected suggestion again clears it, so a mis-click isn't
  // permanent — there is otherwise no way back to "no answer" for a question.
  const toggleAnswer = (index, option) => {
    setAnswers((prev) => ({ ...prev, [index]: prev[index] === option ? '' : option }))
  }

  const answered = questions
    .map((q, i) => ({ q, i }))
    .filter(({ i }) => (answers[i] || '').trim())
  const canSubmit = answered.length > 0 && !disabled

  const submit = () => {
    if (!canSubmit) return
    // The server still merges by key, so that is what goes back out — the
    // positional indexing is this component's business only.
    onSubmit(answered.map(({ q, i }) => ({ key: q.key, answer: answers[i].trim() })))
  }

  return (
    <div
      className="cut cut-lg"
      style={{
        /* Answered questions settle onto the draft surface. Not dimmed —
           see the note in PlanReviewCard: container opacity fails AA. */
        backgroundColor: resolved ? 'var(--sunk)' : 'var(--panel)',
        boxShadow: 'inset 0 0 0 1px var(--etch)',
        paddingBlock: 16,
        paddingInlineStart: 16,
        paddingInlineEnd: 24,
      }}
    >
      <div className="flex items-center gap-2" style={{ marginBlockEnd: 4 }}>
        <Help size={16} style={{ color: 'var(--ink-3)' }} />
        <span className="legend" style={{ margin: 0 }}>{tx('detailsFirst')}</span>
      </div>

      <div>
        {questions.map((q, i) => (
          <div
            // Position, for the same reason the answers are: duplicate q.key
            // values would collide as React keys and make the list re-order
            // unpredictably as answers come in.
            key={`${q.key || 'q'}-${i}`}
            className="grid grid-cols-[28px_minmax(0,1fr)] items-start"
            style={{
              paddingBlock: 12,
              borderBlockStart: i === 0 ? 'none' : '1px solid var(--etch)',
            }}
          >
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'start', paddingBlockStart: 2 }}>
              {String(i + 1).padStart(2, '0')}
            </span>

            <div className="min-w-0 flex flex-col gap-2">
              <span style={{ fontSize: 13, color: 'var(--ink)' }}>{q.question}</span>

              {(q.options || []).length > 0 && (
                <div className="rocker self-start" role="group" aria-label={q.question}>
                  {(q.options || []).map((option, oi) => (
                    <button
                      key={`${option}-${oi}`}
                      type="button"
                      className="rocker__cell disabled:opacity-50"
                      data-on={answers[i] === option ? 'true' : 'false'}
                      aria-pressed={answers[i] === option}
                      onClick={() => toggleAnswer(i, option)}
                      disabled={disabled}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              <input
                type="text"
                value={(q.options || []).includes(answers[i]) ? '' : (answers[i] || '')}
                onChange={(e) => setAnswer(i, e.target.value)}
                disabled={disabled}
                placeholder={tx('typeYourOwn')}
                className="field field--sm disabled:opacity-50"
                style={{ maxInlineSize: 420 }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderBlockStart: '1px solid var(--etch)', paddingBlockStart: 12, marginBlockStart: 4 }}>
        {resolved ? (
          <span className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            {resolution === 'cancelled' ? <Void size={14} /> : <Caret size={14} />}
            {resolution === 'cancelled' ? tx('cancelled') : tx('answered')}
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-6">
            <button type="button" onClick={submit} disabled={!canSubmit} className="text-action">
              {busy
                ? <Meter cells={3} mode="indeterminate" tone="signal" label={tx('continueLabel')} />
                : <Caret size={16} />}
              {tx('continueLabel')}
            </button>

            <button type="button" onClick={onCancel} disabled={busy} className="text-action">
              <Void size={16} />
              {tx('cancel')}
            </button>

            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{tx('skipHint')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClarificationCard
