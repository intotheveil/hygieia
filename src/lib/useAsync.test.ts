import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAsync, useAsyncResult, type ResultLike } from './useAsync'

/** A promise with its resolvers exposed, so a test controls WHEN each call settles. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/** `run` starts on a microtask (never synchronously inside the effect); this lets it start. */
const flush = () => act(async () => {})

describe('useAsync', () => {
  it('is loading until the promise resolves, then ready with the data', async () => {
    const d = deferred<number>()
    const run = vi.fn(() => d.promise)
    const { result } = renderHook(() => useAsync(run))
    expect(result.current).toMatchObject({ status: 'loading', data: undefined, error: undefined })
    await act(async () => {
      d.resolve(42)
      await d.promise
    })
    expect(result.current).toMatchObject({ status: 'ready', data: 42, error: undefined })
    expect(run).toHaveBeenCalledTimes(1)
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
    expect(result.current.data).toBeUndefined()
    expect((result.current.error as Error).message).toBe('boom')
  })

  it('reports a synchronous throw as error too', async () => {
    const run = (): Promise<string> => {
      throw new Error('sync')
    }
    const { result } = renderHook(() => useAsync(run))
    await flush()
    expect(result.current.status).toBe('error')
    expect((result.current.error as Error).message).toBe('sync')
  })

  it('goes back to loading when a new run identity arrives, and runs it', async () => {
    const first = () => Promise.resolve('one')
    const second = () => Promise.resolve('two')
    const { result, rerender } = renderHook(({ run }) => useAsync(run), {
      initialProps: { run: first },
    })
    await waitFor(() => expect(result.current).toMatchObject({ status: 'ready', data: 'one' }))
    rerender({ run: second })
    // Synchronously on the rerender: the old outcome belongs to another run.
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current).toMatchObject({ status: 'ready', data: 'two' }))
  })

  it('drops a stale resolution: the old run settling later never overwrites the new data', async () => {
    const slow = deferred<string>()
    const fast = deferred<string>()
    const slowRun = () => slow.promise
    const fastRun = () => fast.promise
    const { result, rerender } = renderHook(({ run }) => useAsync(run), {
      initialProps: { run: slowRun },
    })
    rerender({ run: fastRun })
    await act(async () => {
      fast.resolve('fast')
      await fast.promise
    })
    expect(result.current).toMatchObject({ status: 'ready', data: 'fast' })
    await act(async () => {
      slow.resolve('slow')
      await slow.promise
    })
    expect(result.current).toMatchObject({ status: 'ready', data: 'fast' })
  })

  it('drops a resolution that lands after unmount', async () => {
    const d = deferred<string>()
    const run = () => d.promise
    const { result, unmount } = renderHook(() => useAsync(run))
    await flush()
    unmount()
    await act(async () => {
      d.resolve('late')
      await d.promise
    })
    expect(result.current.status).toBe('loading')
  })

  it('reload re-runs the same run and is loading until it settles', async () => {
    const calls: Array<ReturnType<typeof deferred<string>>> = []
    const run = vi.fn(() => {
      const d = deferred<string>()
      calls.push(d)
      return d.promise
    })
    const { result } = renderHook(() => useAsync(run))
    await flush()
    expect(run).toHaveBeenCalledTimes(1)
    await act(async () => {
      calls[0].resolve('first')
      await calls[0].promise
    })
    expect(result.current).toMatchObject({ status: 'ready', data: 'first' })

    act(() => result.current.reload())
    expect(result.current.status).toBe('loading')
    await flush()
    expect(run).toHaveBeenCalledTimes(2)
    await act(async () => {
      calls[1].resolve('second')
      await calls[1].promise
    })
    expect(result.current).toMatchObject({ status: 'ready', data: 'second' })
  })

  it('`deps` key the run like useCallback: same deps → no re-run, new deps → loading then re-run', async () => {
    const run = vi.fn((tag: string) => () => Promise.resolve(tag))
    const { result, rerender } = renderHook(
      ({ key }: { key: string }) => useAsync(run(key), [key]),
      { initialProps: { key: 'a' } },
    )
    await waitFor(() => expect(result.current).toMatchObject({ status: 'ready', data: 'a' }))
    rerender({ key: 'a' })
    expect(result.current).toMatchObject({ status: 'ready', data: 'a' })
    rerender({ key: 'b' })
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current).toMatchObject({ status: 'ready', data: 'b' }))
  })

  it('returns the same state object across renders while nothing settled', async () => {
    const d = deferred<number>()
    const run = () => d.promise
    const { result, rerender } = renderHook(() => useAsync(run))
    const before = result.current
    rerender()
    expect(result.current).toBe(before)
    await act(async () => {
      d.resolve(1)
      await d.promise
    })
    expect(result.current).not.toBe(before)
  })
})

describe('useAsyncResult', () => {
  it('unwraps ok: true into ready with the data', async () => {
    const run = () => Promise.resolve<ResultLike<number[], 'network'>>({ ok: true, data: [1, 2] })
    const { result } = renderHook(() => useAsyncResult(run))
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current).toMatchObject({ status: 'ready', data: [1, 2] }))
  })

  it('turns ok: false into error carrying the Result error code', async () => {
    const run = () =>
      Promise.resolve<ResultLike<number[], 'network' | 'unknown'>>({ ok: false, error: 'network' })
    const { result } = renderHook(() => useAsyncResult(run))
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe('network')
    expect(result.current.data).toBeUndefined()
  })

  it('still reports a rejection as error, and reload re-runs the Result read', async () => {
    let fail = true
    const run = vi.fn((): Promise<ResultLike<string, 'unknown'>> =>
      fail ? Promise.reject(new Error('down')) : Promise.resolve({ ok: true, data: 'up' }),
    )
    const { result } = renderHook(() => useAsyncResult(run))
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect((result.current.error as Error).message).toBe('down')
    fail = false
    act(() => result.current.reload())
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current).toMatchObject({ status: 'ready', data: 'up' }))
    expect(run).toHaveBeenCalledTimes(2)
  })
})
