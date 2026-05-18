import { useState, useRef, useEffect } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EmojiData = any

export function useEmojiPicker(onSelect: (text: string) => void) {
  const [showPicker, setShowPicker] = useState(false)
  const [emojiData, setEmojiData] = useState<EmojiData>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showPicker && !emojiData) {
      import('@emoji-mart/data').then((m) => setEmojiData(m.default))
    }
  }, [showPicker, emojiData])

  useEffect(() => {
    if (!showPicker) return
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPicker])

  function handleEmojiSelect(emoji: { native: string }) {
    onSelect(emoji.native)
    setShowPicker(false)
  }

  return { showPicker, setShowPicker, pickerRef, emojiData, handleEmojiSelect }
}
