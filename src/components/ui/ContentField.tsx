import { useRef, lazy, Suspense } from 'react'
import { useEmojiPicker } from '../../hooks/useEmojiPicker'
import { useThemeStore } from '../../stores/themeStore'
import MentionTextarea, { type MentionTextareaHandle } from './MentionTextarea'
import EmojiPickerErrorBoundary from './EmojiPickerErrorBoundary'

const Picker = lazy(() => import('@emoji-mart/react'))

interface ContentFieldProps {
  value: string
  onChange: (value: string) => void
  groupId?: string
  rows?: number
  placeholder?: string
}

export default function ContentField({ value, onChange, groupId, rows = 3, placeholder }: ContentFieldProps) {
  const theme = useThemeStore((s) => s.theme)
  const mentionRef = useRef<MentionTextareaHandle>(null)

  const { showPicker, setShowPicker, pickerRef, emojiData, handleEmojiSelect } = useEmojiPicker(
    (text) => mentionRef.current?.insertText(text)
  )

  return (
    <div className="relative">
      {showPicker && emojiData && (
        <div ref={pickerRef} className="absolute top-full right-0 mt-1 z-50">
          <EmojiPickerErrorBoundary>
            <Suspense fallback={null}>
              <Picker
                data={emojiData}
                onEmojiSelect={handleEmojiSelect}
                theme={theme}
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={1}
              />
            </Suspense>
          </EmojiPickerErrorBoundary>
        </div>
      )}
      <MentionTextarea
        ref={mentionRef}
        value={value}
        onChange={onChange}
        groupId={groupId}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
      />
      <button
        type="button"
        onClick={() => setShowPicker((v) => !v)}
        aria-label="Insert emoji"
        className="absolute bottom-2 right-2.5 text-lg leading-none text-muted hover:text-primary transition"
      >
        🙂
      </button>
    </div>
  )
}
