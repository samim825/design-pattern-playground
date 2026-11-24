import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  error: Error | null
}

/** Keeps one broken pattern page from blanking the whole app. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <p className="text-5xl" aria-hidden="true">
            💥
          </p>
          <h1 className="mt-4 text-xl font-bold text-ink font-display">Something went wrong</h1>
          <pre className="mt-3 overflow-auto rounded-lg border-2 border-edge bg-card p-3 text-left text-xs text-chili">
            {this.state.error.message}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
