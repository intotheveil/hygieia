import { act, render, screen } from '@testing-library/react'
import { Component, Suspense, useState, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { LangProvider } from '../i18n/LangProvider'
import { appDictionaries } from '../i18n/app'
import { lazyPage } from './lazyPage'

function Page({ label }: { label: string }) {
  const [count, setCount] = useState(0)
  return (
    <main>
      <h1>{label}</h1>
      <button type="button" onClick={() => setCount((n) => n + 1)}>
        clicked {count}
      </button>
    </main>
  )
}

class Boundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null }
  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
  render() {
    return this.state.error ? <p role="alert">{this.state.error}</p> : this.props.children
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const frame = (children: ReactNode) => (
  <LangProvider initial="en">
    <Boundary>
      <Suspense fallback={<p>suspense fallback</p>}>{children}</Suspense>
    </Boundary>
  </LangProvider>
)

describe('lazyPage', () => {
  it('shows the bilingual page loading line, then swaps the page in without Suspense', async () => {
    const module = deferred<typeof Page>()
    const LazyRoute = lazyPage(() => module.promise)
    render(frame(<LazyRoute label="Recipes" />))

    expect(screen.getByRole('status')).toHaveTextContent(appDictionaries.en.loading)
    expect(screen.queryByText('suspense fallback')).toBeNull() // no Suspense reveal involved

    await act(async () => module.resolve(Page))
    expect(screen.getByRole('heading', { level: 1, name: 'Recipes' })).toBeInTheDocument()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('imports the module once and renders an already-loaded page on the first render', async () => {
    const load = vi.fn(() => Promise.resolve(Page))
    const LazyRoute = lazyPage(load)
    const first = render(frame(<LazyRoute label="One" />))
    expect(await screen.findByRole('heading', { name: 'One' })).toBeInTheDocument()
    first.unmount()

    render(frame(<LazyRoute label="Two" />))
    // Synchronously there: no loading line on a second mount.
    expect(screen.getByRole('heading', { name: 'Two' })).toBeInTheDocument()
    expect(screen.queryByRole('status')).toBeNull()
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('preload() starts the same single import', async () => {
    const load = vi.fn(() => Promise.resolve(Page))
    const LazyRoute = lazyPage(load)
    await expect(LazyRoute.preload()).resolves.toBe(Page)
    await LazyRoute.preload()
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('keeps the mounted page (and its state) when the parent re-renders after the load', async () => {
    const LazyRoute = lazyPage(() => Promise.resolve(Page))
    const view = render(frame(<LazyRoute label="Stateful" />))
    const button = await screen.findByRole('button', { name: 'clicked 0' })
    act(() => button.click())
    expect(screen.getByRole('button', { name: 'clicked 1' })).toBeInTheDocument()
    view.rerender(frame(<LazyRoute label="Stateful" />))
    expect(screen.getByRole('button', { name: 'clicked 1' })).toBeInTheDocument()
  })

  it('after a failed import retries once through React.lazy and renders on success', async () => {
    const load = vi
      .fn<() => Promise<typeof Page>>()
      .mockRejectedValueOnce(new Error('chunk failed'))
      .mockResolvedValue(Page)
    const LazyRoute = lazyPage(load)
    render(frame(<LazyRoute label="Retried" />))
    expect(await screen.findByRole('heading', { name: 'Retried' })).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('when the retry fails too, the error reaches the nearest boundary (as React.lazy did)', async () => {
    const load = vi.fn(() => Promise.reject(new Error('chunk gone')))
    const LazyRoute = lazyPage<{ label: string }>(load)
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(frame(<LazyRoute label="Never" />))
    expect(await screen.findByRole('alert')).toHaveTextContent('chunk gone')
    spy.mockRestore()
  })
})
