/* ═══════════════════════════════════════════════════════════════════════════
   THE TRANSCRIPT

   One scroll surface, one measure, no gutter. What was here before was laid on
   a 56px numbered spine that printed a zero-padded turn ordinal beside every
   message; that whole apparatus is gone, along with `.wz-page` and
   `.wz-gutter`.

   THE WORKING STATE. No bouncing dots and no filling gauge. While the machine
   is thinking, the turn that is about to exist is drawn as a real row carrying
   a STATUS FIELD — a word and the one dot in this system permitted to move
   (.st--run breathes). The scroll anchor is unchanged, so the view still
   follows the run.

   THE EMPTY STATE of an open-but-unused project keeps three REAL starter rows
   that submit the prompt they name. Nothing here is a dead control, and the
   route's "no project selected" case is not this component's business any
   more — that is the workspace grid, in ChatPage.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import { Caret } from '../Icon'
import ErrorBoundary from '../ErrorBoundary'
import { useUIStore } from '../../store/uiStore'
import { useChatText } from './chatKit'

function WorkingRow({ phase, tx }) {
  return (
    <div className="settle">
      <div className="label" style={{ marginBlockEnd: 6 }}>{tx('wazza')}</div>
      <span className="st st--run">{phase || tx('working')}</span>
    </div>
  )
}

function TranscriptEmpty({ t, tx, onSubmit, disabled }) {
  const starters = [tx('starter1'), tx('starter2'), tx('starter3')]

  return (
    <div className="card card-pad">
      <h2 className="sec-title">{tx('emptyLegend')}</h2>
      <p style={{ color: 'var(--ink-2)', fontSize: 14, marginBlockStart: 2 }}>{t('enterPrompt')}</p>

      <div className="label" style={{ marginBlockStart: 20, marginBlockEnd: 4 }}>{tx('starterLegend')}</div>
      <ul>
        {starters.map((text) => (
          <li key={text} style={{ borderBlockStart: '1px solid var(--line)' }}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSubmit?.(text)}
              className="btn-t"
              style={{ paddingBlock: 11, alignItems: 'start', textAlign: 'start', inlineSize: '100%' }}
            >
              <Caret size={15} style={{ marginBlockStart: 3, flex: 'none' }} />
              <span style={{ fontSize: 14, lineHeight: 'var(--lh)' }}>{text}</span>
            </button>
          </li>
        ))}
      </ul>
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
    <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6" style={{ paddingBlock: 20 }}>
      <div className="flex flex-col gap-7" style={{ maxInlineSize: 900, marginInline: 'auto' }}>
        {messages.length === 0 && !loading ? (
          <TranscriptEmpty t={t} tx={tx} onSubmit={onSubmit} disabled={loading} />
        ) : (
          <>
            {messages.map((message, index) => (
              message && (
                /* Keyed by index, deliberately. Messages are addressed BY
                   ARRAY INDEX everywhere in this flow — the plan card, the
                   progress target and the retry handler all hold one — so the
                   render key is the same identity the rest of the page uses. */
                <ErrorBoundary key={index}>
                  <MessageBubble index={index} message={message} handlers={handlers} />
                </ErrorBoundary>
              )
            ))}
            {loading && <WorkingRow phase={phase} tx={tx} />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default ChatMessages
