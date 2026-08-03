/* ═══════════════════════════════════════════════════════════════════════════
   THE CLARIFICATION CARD

   Shown when the prompt enhancer flagged details it would otherwise have to
   guess (hair colour, clothing, setting, time of day). Each question offers a
   couple of suggested answers, but free text always wins — the backend merges
   whatever string it receives straight into the spec.

   The suggestions are a SEGMENTED CONTROL (.seg). The selected cell is raised
   and inked, never filled with the accent: answering a question neither runs
   anything nor costs anything, and principle 4 only survives if controls stop
   spending the accent. Clicking the selected cell again clears it, so a
   mis-click is not permanent.

   NOTHING HERE IS FILLED. This card asks questions; it does not spend money.
   The one filled control on the screen belongs to the authorisation, and there
   is no authorisation to make yet.

   Status is a field: a word and a dot, once the card is resolved.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react'
import { Caret, Void } from '../Icon'
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

  const state = resolved
    ? (resolution === 'cancelled'
        ? { cls: 'st--idle', word: tx('cancelled') }
        : { cls: 'st--ok', word: tx('answered') })
    : { cls: 'st--run', word: tx('stWaiting') }

  return (
    <section className="card" aria-label={tx('detailsFirst')}>
      <header
        className="card-pad flex flex-wrap items-center gap-x-4 gap-y-2"
        style={{ borderBlockEnd: '1px solid var(--line)' }}
      >
        <div className="min-w-0">
          <h2 className="sec-title">{tx('detailsFirst')}</h2>
          <p className="caption">{tx('detailsSub')}</p>
        </div>
        <span className={`st ${state.cls}`} style={{ marginInlineStart: 'auto' }}>{state.word}</span>
      </header>

      <ol className="card-pad" style={{ paddingBlock: 0 }}>
        {questions.map((q, i) => (
          <li
            // Position, for the same reason the answers are: duplicate q.key
            // values would collide as React keys and make the list re-order
            // unpredictably as answers come in.
            key={`${q.key || 'q'}-${i}`}
            className="grid items-start"
            style={{
              gridTemplateColumns: '32px minmax(0, 1fr)',
              columnGap: 12,
              paddingBlock: 14,
              borderBlockStart: i === 0 ? 'none' : '1px solid var(--line)',
            }}
          >
            {/* A step sequence: the numeral leads, and it mirrors with the
                document. .mono keeps the Latin numeral upright inside an
                Arabic run (A3). */}
            <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', paddingBlockStart: 2 }}>
              {String(i + 1).padStart(2, '0')}
            </span>

            <div className="min-w-0 flex flex-col gap-2">
              {/* The enhancer writes its questions in the language of the
                  PROMPT, so an English question can land inside this Arabic
                  card. Without isolation the bidi algorithm drags the trailing
                  "?" to the front — "?What hair color should the courier have"
                  — because a neutral character at the edge of an LTR run
                  resolves against the RTL paragraph. <bdi> scopes it. */}
              <bdi style={{ fontSize: 14, color: 'var(--ink)' }}>{q.question}</bdi>

              {/* CHIPS, not a segmented control. These are answers to a
                  question — each is its own choice, they are often full
                  sentences, and before one is picked a segmented housing shows
                  no selection at all and reads as a single dead slab. */}
              {(q.options || []).length > 0 && (
                <div className="chip-row" role="group" aria-label={q.question}>
                  {(q.options || []).map((option, oi) => (
                    <button
                      key={`${option}-${oi}`}
                      type="button"
                      className="chip"
                      data-on={answers[i] === option ? 'true' : 'false'}
                      aria-pressed={answers[i] === option}
                      onClick={() => toggleAnswer(i, option)}
                      disabled={disabled}
                    >
                      <bdi>{option}</bdi>
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
                aria-label={q.question}
                className="field field--sm disabled:opacity-50"
                style={{ maxInlineSize: 420 }}
              />
            </div>
          </li>
        ))}
      </ol>

      {!resolved && (
        <footer className="card-pad card-2" style={{ borderBlockStart: '1px solid var(--line)' }}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <button type="button" onClick={submit} disabled={!canSubmit} className="btn-q">
              <Caret size={15} />
              {tx('continueLabel')}
            </button>

            <span className="caption">{tx('skipHint')}</span>

            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="btn-t btn-t--danger"
              style={{ marginInlineStart: 'auto' }}
            >
              <Void size={15} />
              {tx('cancel')}
            </button>
          </div>
        </footer>
      )}
    </section>
  )
}

export default ClarificationCard
