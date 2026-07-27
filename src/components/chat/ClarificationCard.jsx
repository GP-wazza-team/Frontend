import React, { useState } from 'react'
import { HelpCircle, Loader2 } from 'lucide-react'

/**
 * Shown when the prompt enhancer flagged details it would otherwise have to
 * guess (hair colour, clothing, setting, time of day). Each question offers two
 * suggested answers, but free text always wins — the backend merges whatever
 * string it receives straight into the spec.
 */
function ClarificationCard({ questions, resolved, busy, onSubmit }) {
  const [answers, setAnswers] = useState({})
  const disabled = resolved || busy

  const setAnswer = (key, answer) => {
    setAnswers((prev) => ({ ...prev, [key]: answer }))
  }

  const answered = questions.filter((q) => (answers[q.key] || '').trim())
  const canSubmit = answered.length > 0 && !disabled

  const submit = () => {
    if (!canSubmit) return
    onSubmit(answered.map((q) => ({ key: q.key, answer: answers[q.key].trim() })))
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
        {questions.map((q) => (
          <div key={q.key} className="flex flex-col gap-1.5">
            <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{q.question}</span>
            <div className="flex flex-wrap gap-1.5">
              {(q.options || []).map((option) => {
                const selected = answers[q.key] === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAnswer(q.key, option)}
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
              value={(q.options || []).includes(answers[q.key]) ? '' : (answers[q.key] || '')}
              onChange={(e) => setAnswer(q.key, e.target.value)}
              disabled={disabled}
              placeholder="or type your own…"
              className="w-full text-[12px] rounded-lg px-2.5 py-1.5 outline-none disabled:opacity-50"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            />
          </div>
        ))}
      </div>

      <div className="px-3.5 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
        {resolved ? (
          <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Answered.</span>
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
