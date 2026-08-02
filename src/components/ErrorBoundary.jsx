/* THE CONTAINMENT ROW.

   Contains a render crash to the single item that caused it instead of
   unmounting the whole app to a blank screen. One malformed message or plan
   should not take down the entire transcript.

   Arrived from main with literal #d97706 amber, a rounded-xl pill and its own
   `max-w-3xl mx-auto` measure — three things the design system does not have.
   Restyled onto the etched row the transcript already uses, and given the
   signal tone, which is what this system uses for "look at this". It renders
   inside TurnRow, so it takes the width it is given rather than centring a
   private island.

   A class component cannot call hooks, so the language is read off the store
   directly. That is a snapshot at render time, which is correct here: this
   row only ever appears after something already went wrong, and a language
   toggle re-renders the transcript above it anyway. */

import React from 'react'
import { useUIStore } from '../store/uiStore'

const TEXT = {
  en: 'This message could not be rendered.',
  ar: 'تعذّر عرض هذه الرسالة.',
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      const ar = useUIStore.getState?.().language === 'ar'
      return (
        <div
          role="status"
          style={{
            borderBlockStart: '1px solid var(--etch)',
            borderBlockEnd: '1px solid var(--etch)',
            paddingBlock: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--signal)' }}>
            {ar ? TEXT.ar : TEXT.en}
          </span>
          {/* The message itself is diagnostic, not prose — mono, and quiet. */}
          <span className="mono truncate" style={{ fontSize: 11, color: 'var(--ink-3)' }} title={this.state.error.message}>
            {this.state.error.message}
          </span>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
