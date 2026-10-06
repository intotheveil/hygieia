import { afterEach, describe, expect, it, vi } from 'vitest'
import { ELEMENT_PAINT_TIMEOUT_MS, afterElementPainted, afterNextPaint } from './afterPaint'

/** Settle every pending microtask (promise callbacks), without advancing any timer. */
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve))

function setVisibility(state: DocumentVisibilityState) {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state)
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('afterNextPaint', () => {
  it('waits two animation frames and then a task before resolving', async () => {
    vi.useFakeTimers()
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frames.push(cb)
      return frames.length
    })
    let done = false
    void afterNextPaint().then(() => (done = true))

    expect(frames).toHaveLength(1)
    frames[0]!(0)
    expect(frames).toHaveLength(2) // the second frame is requested only from the first
    frames[1]!(16)
    await flush()
    expect(done).toBe(false) // still waiting for the task after the second frame
    vi.runAllTimers()
    await flush()
    expect(done).toBe(true)
  })

  it('resolves at once for a hidden document (no frames are coming)', async () => {
    setVisibility('hidden')
    const raf = vi.spyOn(window, 'requestAnimationFrame')
    await afterNextPaint()
    expect(raf).not.toHaveBeenCalled()
  })

  it('resolves when the document changes visibility while waiting', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1) // frames never run
    let done = false
    void afterNextPaint().then(() => (done = true))
    await flush()
    expect(done).toBe(false)
    document.dispatchEvent(new Event('visibilitychange'))
    await flush()
    expect(done).toBe(true)
  })
})

/** A stand-in for Chromium's PerformanceObserver with the `element` entry type. */
class FakeObserver {
  static supportedEntryTypes = ['element', 'largest-contentful-paint']
  static instances: FakeObserver[] = []
  disconnected = false
  observed: unknown = null
  constructor(private readonly callback: (list: { getEntries: () => PerformanceEntry[] }) => void) {
    FakeObserver.instances.push(this)
  }
  observe(options: unknown) {
    this.observed = options
  }
  disconnect() {
    this.disconnected = true
  }
  emit(...identifiers: string[]) {
    const entries = identifiers.map((identifier) => ({ entryType: 'element', identifier }))
    this.callback({ getEntries: () => entries as unknown as PerformanceEntry[] })
  }
}

describe('afterElementPainted', () => {
  it('falls back to afterNextPaint where Element Timing is not supported (jsdom)', async () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })
    await afterElementPainted('anything')
    expect(raf).toHaveBeenCalledTimes(2)
  })

  it('resolves on the entry for ITS identifier only, buffered, and disconnects', async () => {
    FakeObserver.instances = []
    vi.stubGlobal('PerformanceObserver', FakeObserver)
    let done = false
    void afterElementPainted('diet-frame').then(() => (done = true))
    const observer = FakeObserver.instances[0]!
    expect(observer.observed).toEqual({ type: 'element', buffered: true })

    observer.emit('some-other-element')
    await flush()
    expect(done).toBe(false)

    observer.emit('diet-frame')
    await flush()
    expect(done).toBe(true)
    expect(observer.disconnected).toBe(true)
  })

  it(`never waits longer than ${ELEMENT_PAINT_TIMEOUT_MS} ms for an element that does not paint`, async () => {
    vi.useFakeTimers()
    FakeObserver.instances = []
    vi.stubGlobal('PerformanceObserver', FakeObserver)
    let done = false
    void afterElementPainted('never-painted').then(() => (done = true))
    vi.advanceTimersByTime(ELEMENT_PAINT_TIMEOUT_MS - 1)
    await flush()
    expect(done).toBe(false)
    vi.advanceTimersByTime(1)
    await flush()
    expect(done).toBe(true)
    expect(FakeObserver.instances[0]!.disconnected).toBe(true)
  })

  it('resolves at once for a hidden document', async () => {
    FakeObserver.instances = []
    vi.stubGlobal('PerformanceObserver', FakeObserver)
    setVisibility('hidden')
    await afterElementPainted('diet-frame')
    expect(FakeObserver.instances).toHaveLength(0)
  })
})
