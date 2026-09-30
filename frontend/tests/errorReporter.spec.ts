import { afterEach, describe, expect, it, vi } from 'vitest'
import { reportError, resetErrorReporter, setErrorReporter } from '~/shared/lib/errorReporter'

describe('error reporter', () => {
  afterEach(() => resetErrorReporter())

  it('does nothing by default', () => {
    expect(() => reportError(new Error('x'))).not.toThrow()
  })

  it('forwards the error and context to the installed reporter', () => {
    const capture = vi.fn()
    setErrorReporter({ capture })
    const error = new Error('boom')

    reportError(error, { requestId: 'r1', status: 500 })

    expect(capture).toHaveBeenCalledWith(error, { requestId: 'r1', status: 500 })
  })

  it('swallows a failing reporter', () => {
    setErrorReporter({
      capture: () => {
        throw new Error('sentry is down')
      },
    })

    expect(() => reportError(new Error('x'))).not.toThrow()
  })
})
