import { renderHook, act } from '@testing-library/react'
import { useKeyboardVisible } from './useKeyboardVisible'

function makeVisualViewport(height: number) {
  const listeners: Record<string, EventListenerOrEventListenerObject[]> = {}
  return {
    height,
    addEventListener: (type: string, cb: EventListenerOrEventListenerObject) => {
      listeners[type] = [...(listeners[type] ?? []), cb]
    },
    removeEventListener: (type: string, cb: EventListenerOrEventListenerObject) => {
      listeners[type] = (listeners[type] ?? []).filter((l) => l !== cb)
    },
    fire: (type: string) => {
      for (const cb of listeners[type] ?? []) {
        if (typeof cb === 'function') cb(new Event(type))
        else cb.handleEvent(new Event(type))
      }
    },
  }
}

describe('useKeyboardVisible', () => {
  const originalInnerHeight = window.innerHeight

  afterEach(() => {
    Object.defineProperty(window, 'visualViewport', { value: null, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true })
  })

  it('returns false when visualViewport is not available', () => {
    Object.defineProperty(window, 'visualViewport', { value: null, configurable: true })
    const { result } = renderHook(() => useKeyboardVisible())
    expect(result.current).toBe(false)
  })

  it('returns false when viewport height matches window height', () => {
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    const vp = makeVisualViewport(800)
    Object.defineProperty(window, 'visualViewport', { value: vp, configurable: true })

    const { result } = renderHook(() => useKeyboardVisible())
    expect(result.current).toBe(false)
  })

  it('returns true when keyboard opens (viewport shrinks by >100px)', () => {
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    const vp = makeVisualViewport(800)
    Object.defineProperty(window, 'visualViewport', { value: vp, configurable: true })

    const { result } = renderHook(() => useKeyboardVisible())

    act(() => {
      vp.height = 450
      vp.fire('resize')
    })

    expect(result.current).toBe(true)
  })

  it('returns false when viewport shrinks by ≤100px (not a keyboard)', () => {
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    const vp = makeVisualViewport(800)
    Object.defineProperty(window, 'visualViewport', { value: vp, configurable: true })

    const { result } = renderHook(() => useKeyboardVisible())

    act(() => {
      vp.height = 750
      vp.fire('resize')
    })

    expect(result.current).toBe(false)
  })
})
