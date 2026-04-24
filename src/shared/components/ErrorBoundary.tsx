import React from 'react'

type ErrorBoundaryProps = {
  children: React.ReactNode
  fallback?: React.ReactNode
  fallbackMessage?: string
  onReset?: () => void
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught render error:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback != null) {
        return this.props.fallback
      }
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center p-8 text-center gap-4"
        >
          {import.meta.env.DEV && this.state.error != null ? (
            <pre className="text-zinc-700 text-sm text-left whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          ) : (
            <p className="text-zinc-700 font-medium">
              {this.props.fallbackMessage ?? 'Something went wrong'}
            </p>
          )}
          <button
            onClick={this.handleReset}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none min-h-[44px]"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
