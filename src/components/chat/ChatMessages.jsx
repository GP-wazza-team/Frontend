/* ═══════════════════════════════════════════════════════════════════════════
   THE TRANSCRIPT

   One scroll surface, laid on the app-wide 56px gutter grid — the same spine
   the ledger, the library and the admin table sit on. The old centred
   `max-w-3xl mx-auto` island shared a grid with nothing else in the product.

   THE EMPTY STATE. No 3xl wordmark, no atmosphere, and no dead controls: the
   four `cursor-default` example chips did nothing on click and are replaced by
   three REAL bilingual starter rows that submit the prompt they name.

   THE WORKING STATE. The three bouncing dots are gone. While the machine is
   thinking, the turn that is about to exist is drawn as a real row on the grid,
   with the Meter — the application's only progress indicator — where the prose
   will land. The scroll anchor is unchanged, so the view still follows the run.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import Meter from '../ui/Meter'
import EmptyState from '../ui/EmptyState'
import { Caret } from '../Icon'
import ErrorBoundary from '../ErrorBoundary'
import { useUIStore } from '../../store/uiStore'
import { useChatText, TurnRow } from './chatKit'

function WorkingRow({ phase, t, tx }) {
  return (
    <TurnRow gutter={<span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'start' }}>··</span>}>
      <span className="flex items-center gap-3" style={{ paddingBlock: 4 }}>
        <Meter cells={5} mode="indeterminate" tone="signal" label={t('generating')} />
        <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{phase || tx('working')}</span>
      </span>
    </TurnRow>
  )
}

/* The transcript's empty state is the app-wide <EmptyState> — a legend, one
   sentence, and real controls — laid on the gutter grid. Each starter row
   submits the prompt it names; the four dead `cursor-default` chips are gone. */
function TranscriptEmpty({ t, onSubmit, disabled }) {
  const { tx } = useChatText()
  const starters = [tx('starter1'), tx('starter2'), tx('starter3')]

  return (
    <div className="wz-page" style={{ alignContent: 'start' }}>
      <span className="wz-gutter mono" style={{ fontSize: 11, paddingBlockStart: 2 }}>00</span>

      <div className="wz-col">
        <EmptyState legend={tx('emptyLegend')} line={t('enterPrompt')} measure="68ch">
          <span className="legend" style={{ marginBlockStart: 24 }}>{tx('starterLegend')}</span>

          <ul>
            {starters.map((text) => (
              <li key={text} style={{ borderBlockEnd: '1px solid var(--etch)' }}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSubmit?.(text)}
                  className="text-action w-full"
                  style={{ paddingBlock: 12, alignItems: 'start' }}
                >
                  <Caret size={16} style={{ marginBlockStart: 1 }} />
                  <span style={{ fontSize: 13, lineHeight: 'var(--lh-body)' }}>{text}</span>
                </button>
              </li>
            ))}
          </ul>
        </EmptyState>
      </div>
    </div>
  )
}

function ChatMessages({ messages, loading, handlers, onSubmit, phase }) {
  const messagesEndRef = useRef(null)
  const { t } = useUIStore()
  const { tx } = useChatText()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
      {messages.length === 0 && !loading ? (
        <TranscriptEmpty t={t} onSubmit={onSubmit} disabled={loading} />
      ) : (
        <div className="flex flex-col gap-6 chat-pad" style={{ paddingBlock: 24, paddingInline: 24 }}>
          {messages.map((message, index) => (
            message && (
              <ErrorBoundary key={index}>
                <MessageBubble index={index} message={message} handlers={handlers} />
              </ErrorBoundary>
            )
          ))}
          {loading && <WorkingRow phase={phase} t={t} tx={tx} />}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  )
}

export default ChatMessages
