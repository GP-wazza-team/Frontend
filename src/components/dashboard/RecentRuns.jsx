/* RECENT RUNS — a real table, not a card with a table inside it.

   The plate is gone. A run list does not need a container: 36px rows, zebra
   by a 1px rule rather than an alternating fill, a sticky header on --panel,
   and a 56px leading column that lands on the page's gutter axis so each
   row's status shape sits on the same line as every other index in the
   application.

   State is a SHAPE in that leading column (L4 — readable without colour) and
   the word repeats at the trailing edge in the same tone. Every number goes
   through the ledger line. The tinted uppercase pill chip is gone with the
   rest of that vocabulary. */

import React, { useState } from 'react'
import { useUIStore } from '../../store/uiStore'
import RunTimeline from './RunTimeline'
import { Money, RunId } from '../ui/Money'
import { RunMarker } from './Instruments'
import EmptyState from '../ui/EmptyState'

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

function RecentRuns({ runs = [] }) {
  const { t, language } = useUIStore()
  const ar = language === 'ar'
  const [openRunId, setOpenRunId] = useState(null)

  if (runs.length === 0) {
    return (
      <EmptyState
        legend={t('noRuns')}
        line={ar
          ? 'لم يُنفَّذ أي تشغيل بعد. ابدأ مهمة من الدردشة وستظهر هنا مع تكلفتها.'
          : 'Nothing has run yet. Start a job from chat and it appears here with what it cost.'}
      />
    )
  }

  return (
    <>
      {/* The sticky thead needs a real scrollport. `overflow-x: auto` alone
          computes overflow-y to auto too, which makes THIS div the nearest
          scroll container — but it has auto height and never scrolls, so the
          header scrolled away with the rows. A bounded block size gives the
          header something to stick to and keeps horizontal scroll intact. */}
      {/* See AdminRunsTable: dvh keeps the bound inside the visible page on
          Safari, and .scroll-x keeps a wide table off the page's own axis. */}
      <div className="scroll-x" style={{ overflowY: 'auto', maxBlockSize: 'min(calc(100vh - 260px), calc(100dvh - 260px))' }}>
        <table className="dtable">
          <thead>
            <tr>
              <th style={{ inlineSize: 'var(--rail-spine)', paddingInlineStart: 0 }} aria-label={t('status')} />
              <th>{ar ? 'التشغيل' : 'Run'}</th>
              <th>{t('date')}</th>
              <th style={{ inlineSize: '38%' }}>{t('prompt')}</th>
              <th>{ar ? 'المسار' : 'Path'}</th>
              <th className="num">{t('cost')}</th>
              <th>{t('status')}</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run, index) => (
              <tr
                key={run.id ?? index}
                onClick={() => run.id && setOpenRunId(run.id)}
                tabIndex={run.id ? 0 : -1}
                onKeyDown={(e) => { if (run.id && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpenRunId(run.id) } }}
                style={{ cursor: run.id ? 'pointer' : 'default' }}
              >
                <td style={{ paddingInlineStart: 0 }}>
                  <RunMarker status={run.status} word={false} />
                </td>
                <td><RunId id={run.id} style={{ color: 'var(--ink-3)' }} /></td>
                <td className="mono" style={{ whiteSpace: 'nowrap', fontSize: 11, color: 'var(--ink-3)', textAlign: 'start' }}>
                  {formatTime(run.started_at)}
                </td>
                <td>
                  <span className="truncate" style={{ display: 'block', color: 'var(--ink)' }}>
                    {run.user_prompt || '—'}
                  </span>
                </td>
                <td className="mono" style={{ whiteSpace: 'nowrap', fontSize: 11, textAlign: 'start' }}>
                  {run.selected_path || '—'}
                </td>
                <td className="num" style={{ whiteSpace: 'nowrap' }}>
                  <Money usd={run.total_cost_usd} />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <RunMarker status={run.status} shape={false} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openRunId && <RunTimeline runId={openRunId} onClose={() => setOpenRunId(null)} />}
    </>
  )
}

export default RecentRuns
