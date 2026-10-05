import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useAsync } from './useAsync'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useAsync', () => {
  it('is loading until the promise resolves, then ready with the data', async () => {
    const d = deferred<number>()
    const run = () => d.promise
    const { result } = renderHook(() => useAsync(run))
    expect(result.current).toEqual({ status: 'loading' })
    await act(async () => {
      d.resolve(42)
      await d.promise
    })
    expect(result.current).toEqual({ status: 'ready', data: 42 })
  })

  it('reports a rejection as error instead of throwing', async () => {
    const d = deferred<number>()
    const run = () => d.promise
    const { result } = renderHook(() => useAsync(run))
    await act(async () => {
      d.reject(new Error('boom'))
      await d.promise.catch(() => undefined)
    })
    expect(result.current.status).toBe('error')
    if (result.current.status === 'error') {
      expect((result.current.error as Error).message).toBe('boom')
    }
  })

  it('goes back to loading when a new run arrives, and runs it', async () => {
    const first = () => Promise.resolve('one')
    const second = () => Promise.resolve('two')
    const { result, rerender } = renderHook(({ run }) => useAsync(run), {
      initialProps: { run: first },
    })
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', data: 'one' }))
    rerender({ run: second })
    // Synchronously on the rerender: the old outcome belongs to another run.
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', data: 'two' }))
  })

  it('drops a resolution that lands after unmount', async () => {
    const d = deferred<string>()
    const run = () => d.promise
    const { result, unmount } = renderHook(() => useAsync(run))
    unmount()
    await act(async () => {
      d.resolve('late')
      await d.promise
    })
    expect(result.current).toEqual({ status: 'loading' })
  })
})
