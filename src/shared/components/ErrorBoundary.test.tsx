import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }): React.JSX.Element {
  if (shouldThrow) throw new Error('Test error message')
  return <div>Rendered successfully</div>
}

describe('ErrorBoundary', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    vi.unstubAllEnvs()
  })

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Rendered successfully')).toBeInTheDocument()
  })

  it('renders fallback with role="alert" when a child throws', () => {
    render(
      <ErrorBoundary fallbackMessage="Test failed">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders "Try again" button in fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('resets error state and re-renders children when retry is clicked', () => {
    let shouldThrow = true
    function ControlledThrower(): React.JSX.Element {
      if (shouldThrow) throw new Error('Controlled error')
      return <div>Recovered</div>
    }

    render(
      <ErrorBoundary>
        <ControlledThrower />
      </ErrorBoundary>
    )

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()

    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(screen.getByText('Recovered')).toBeInTheDocument()
  })

  it('calls onReset callback when "Try again" is clicked', () => {
    const onReset = vi.fn()
    render(
      <ErrorBoundary onReset={onReset}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('shows fallbackMessage in production mode (DEV=false)', () => {
    const originalDEV = import.meta.env.DEV
    vi.stubEnv('DEV', false)

    render(
      <ErrorBoundary fallbackMessage="Board failed to load">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Board failed to load')).toBeInTheDocument()

    vi.stubEnv('DEV', originalDEV)
  })

  it('renders custom fallback node when fallback prop is provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Custom fallback')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })
})
