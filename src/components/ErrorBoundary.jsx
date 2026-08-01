import React from 'react'

/**
 * Contains a render crash to the single item that caused it instead of
 * unmounting the whole app to a blank screen. One malformed message/plan
 * shouldn't take down the entire chat.
 */
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
      return (
        <div
          className="max-w-3xl mx-auto rounded-xl px-3.5 py-2.5 text-[12px]"
          style={{ border: '1px solid #d97706', color: '#d97706', backgroundColor: 'rgba(217,119,6,0.08)' }}
        >
          Couldn't render this message: {this.state.error.message}
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
