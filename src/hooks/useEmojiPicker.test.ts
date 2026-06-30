import { renderHook, act, waitFor } from '@testing-library/react'
import { useEmojiPicker } from './useEmojiPicker'

vi.mock('@emoji-mart/data', () => ({ default: { emojis: {} } }))

describe('useEmojiPicker', () => {
  it('starts with picker closed and no emoji data', () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() => useEmojiPicker(onSelect))
    expect(result.current.showPicker).toBe(false)
    expect(result.current.emojiData).toBeNull()
  })

  it('opens the picker via setShowPicker', () => {
    const { result } = renderHook(() => useEmojiPicker(vi.fn()))
    act(() => result.current.setShowPicker(true))
    expect(result.current.showPicker).toBe(true)
  })

  it('lazy-loads emoji data when picker opens', async () => {
    const { result } = renderHook(() => useEmojiPicker(vi.fn()))
    act(() => result.current.setShowPicker(true))
    await waitFor(() => expect(result.current.emojiData).not.toBeNull())
  })

  it('does not load emoji data when picker stays closed', async () => {
    const { result } = renderHook(() => useEmojiPicker(vi.fn()))
    expect(result.current.emojiData).toBeNull()
    // give effects a chance to run
    await act(async () => {})
    expect(result.current.emojiData).toBeNull()
  })

  it('handleEmojiSelect calls onSelect with the native emoji and closes the picker', () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() => useEmojiPicker(onSelect))
    act(() => result.current.setShowPicker(true))
    act(() => result.current.handleEmojiSelect({ native: '😊' }))
    expect(onSelect).toHaveBeenCalledWith('😊')
    expect(result.current.showPicker).toBe(false)
  })

  it('closes picker on mousedown outside the picker ref', () => {
    const { result } = renderHook(() => useEmojiPicker(vi.fn()))
    act(() => result.current.setShowPicker(true))

    // Give the pickerRef a real DOM element so the containment check works
    const pickerEl = document.createElement('div')
    document.body.appendChild(pickerEl)
    Object.defineProperty(result.current.pickerRef, 'current', { value: pickerEl, writable: true, configurable: true })

    act(() => {
      // Click somewhere outside pickerEl — bubbles up to document
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })

    expect(result.current.showPicker).toBe(false)
    document.body.removeChild(pickerEl)
  })

  it('does not close picker on mousedown inside the picker ref', () => {
    const { result } = renderHook(() => useEmojiPicker(vi.fn()))
    act(() => result.current.setShowPicker(true))

    const inner = document.createElement('div')
    const container = document.createElement('div')
    container.appendChild(inner)
    document.body.appendChild(container)

    // Simulate the ref pointing at container
    Object.defineProperty(result.current.pickerRef, 'current', {
      value: container,
      writable: true,
    })

    act(() => {
      inner.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })

    expect(result.current.showPicker).toBe(true)
    document.body.removeChild(container)
  })
})
