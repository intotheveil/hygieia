import { act, render, screen } from '@testing-library/react'
import { useCallback, useState } from 'react'
import { useAsync } from './useAsync'

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

function Probe({ fn }: { fn: () => Promise<string> }) {
  const { state, retry } = useAsync(fn)
  return (
    <div>
      <output data-testid="state">
        {state.status === 'done'
          ? `done:${state.value}`
          : state.status === 'failed'
            ? `failed:${String(state.error)}`
            : 'loading'}
      </output>
      <button type="button" onClick={retry}>
        retry
      </button>
    </div>
  )
}

const flush = () => act(async () => {})

describe('useAsync', () => {
  it('is loading until the promise resolves, then exposes the value', async () => {
    const d = deferred<string>()
    const fn = vi.fn(() => d.promise)
    render(<Probe fn={fn} />)
    expect(screen.getByTestId('state')).toHaveTextContent('loading')
    await act(async () => d.resolve('ok'))
    expect(screen.getByTestId('state')).toHaveTextContent('done:ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('reports a rejection (and a synchronous throw) as failed', async () => {
    const rejecting = () => Promise.reject(new Error('boom'))
    const { unmount } = render(<Probe fn={rejecting} />)
    await flush()
    expect(screen.getByTestId('state')).toHaveTextContent('failed:Error: boom')
    unmount()

    const throwing = () => {
      throw new Error('sync')
    }
    render(<Probe fn={throwing} />)
    await flush()
    expect(screen.getByTestId('state')).toHaveTextContent('failed:Error: sync')
  })

  it('retry runs fn again and goes back to loading until it settles', async () => {
    const calls: Array<ReturnType<typeof deferred<string>>> = []
    const fn = vi.fn(() => {
      const d = deferred<string>()
      calls.push(d)
      return d.promise
    })
    render(<Probe fn={fn} />)
    // `fn` is invoked on a microtask (never synchronously inside the effect), hence the flush.
    await flush()
    expect(fn).toHaveBeenCalledTimes(1)
    await act(async () => calls[0].resolve('first'))
    expect(screen.getByTestId('state')).toHaveTextContent('done:first')

    act(() => screen.getByRole('button', { name: 'retry' }).click())
    expect(screen.getByTestId('state')).toHaveTextContent('loading')
    await flush()
    expect(fn).toHaveBeenCalledTimes(2)
    await act(async () => calls[1].resolve('second'))
    expect(screen.getByTestId('state')).toHaveTextContent('done:second')
  })

  it('ignores a stale promise when fn changes before it settles', async () => {
    const slow = deferred<string>()
    const fast = deferred<string>()
    function Host() {
      const [which, setWhich] = useState<'slow' | 'fast'>('slow')
      const fn = useCallback(() => (which === 'slow' ? slow.promise : fast.promise), [which])
      return (
        <div>
          <Probe fn={fn} />
          <button type="button" onClick={() => setWhich('fast')}>
            switch
          </button>
        </div>
      )
    }
    render(<Host />)
    act(() => screen.getByRole('button', { name: 'switch' }).click())
    expect(screen.getByTestId('state')).toHaveTextContent('loading')
    await act(async () => fast.resolve('fast'))
    expect(screen.getByTestId('state')).toHaveTextContent('done:fast')
    // The old promise settling later must not overwrite the current outcome.
    await act(async () => slow.resolve('slow'))
    expect(screen.getByTestId('state')).toHaveTextContent('done:fast')
  })
})
