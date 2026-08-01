import React, { useState } from 'react'
import { HelpCircle, Loader2 } from 'lucide-react'

/**
 * Shown when the prompt enhancer flagged details it would otherwise have to
 * guess (hair colour, clothing, setting, time of day). Each question offers two
 * suggested answers, but free text always wins — the backend merges whatever
 * string it receives straight into the spec.
 */
/**
 * A question's own identity. `key` alone is the checklist item ("clothing_style"),
 * which repeats once per character in a multi-character scene — two people both
 * get asked what they wear. Keying answers by it alone made those questions share
 * one slot, so answering for John filled in Kamel's box as well.
 */
const idOf = (q) => `${q.key}::${q.character_name || ''}::${q.scene_number ?? ''}`

function ClarificationCard({ questions, resolved, resolution, busy, onSubmit, onCancel }) {
  const [answers, setAnswers] = useState({})
  const disabled = resolved || busy

  const setAnswer = (id, answer) => {
    setAnswers((prev) => ({ ...prev, [id]: answer }))
  }

  // Clicking the selected suggestion again clears it, so a mis-click isn't
  // permanent — there is otherwise no way back to "no answer" for a question.
  const toggleAnswer = (id, option) => {
    setAnswers((prev) => ({ ...prev, [id]: prev[id] === option ? '' : option }))
  }

  const answered = questions.filter((q) => (answers[idOf(q)] || '').trim())
  const canSubmit = answered.length > 0 && !disabled

  const submit = () => {
    if (!canSubmit) return
    onSubmit(answered.map((q) => ({
      key: q.key,
      answer: answers[idOf(q)].trim(),
      // Sent back so the backend applies the answer to the character it was
      // asked about, rather than assuming the first one in the cast.
      character_name: q.character_name ?? null,
      scene_number: q.scene_number ?? null,
    })))
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'rgba(128,128,128,0.04)' }}>
      <div className="px-3.5 py-2.5 flex items-center gap-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <HelpCircle size={13} style={{ color: 'var(--accent)' }} />
        <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>
          A few details first
        </span>
      </div>

      <div className="px-3.5 py-3 flex flex-col gap-3.5">
        {questions.map((q) => {
          const id = idOf(q)
          return (
          <div key={id} className="flex flex-col gap-1.5">
            <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{q.question}</span>
            <div className="flex flex-wrap gap-1.5">
              {(q.options || []).map((option) => {
                const selected = answers[id] === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleAnswer(id, option)}
                    disabled={disabled}
                    className="text-[11px] px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                    style={{
                      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                      backgroundColor: selected ? 'var(--accent)' : 'transparent',
                      color: selected ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
            <input
              type="text"
              value={(q.options || []).includes(answers[id]) ? '' : (answers[id] || '')}
              onChange={(e) => setAnswer(id, e.target.value)}
              disabled={disabled}
              placeholder="or type your own…"
              className="w-full text-[12px] rounded-lg px-2.5 py-1.5 outline-none disabled:opacity-50"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            />
          </div>
          )
        })}
      </div>

      <div className="px-3.5 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
        {resolved ? (
          <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            {resolution === 'cancelled' ? 'Cancelled.' : 'Answered.'}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
            >
              {busy && <Loader2 size={12} className="animate-spin" />}
              Continue
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="text-[12px] px-3 py-1.5 rounded-lg disabled:opacity-50"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              Anything you skip is filled in with a sensible default.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClarificationCard
