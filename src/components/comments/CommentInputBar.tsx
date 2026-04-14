import { useRef, useEffect, useState, lazy, Suspense } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createComment } from '../../api/comments'

const Picker = lazy(() => import('@emoji-mart/react'))
import { getApiError } from '../../lib/utils'
import { useToast } from '../../stores/toastStore'
import { useInstallPromptStore } from '../../stores/installPromptStore'
import type { Comment } from '../../types/api'

interface ReplyingTo {
  id: string
  name: string
}

interface CommentInputBarProps {
  postId: string
  replyingTo: ReplyingTo | null
  onCancelReply: () => void
}

export default function CommentInputBar({ postId, replyingTo, onCancelReply }: CommentInputBarProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()
  const toast = useToast()
  const triggerInstall = useInstallPromptStore((s) => s.trigger)
  const [focused, setFocused] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [emojiData, setEmojiData] = useState<any>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Focus input when reply target changes
  useEffect(() => {
    if (replyingTo) inputRef.current?.focus()
  }, [replyingTo])

  // Load emoji data on first open
  useEffect(() => {
    if (showPicker && !emojiData) {
      import('@emoji-mart/data').then((m) => setEmojiData(m.default))
    }
  }, [showPicker, emojiData])

  // Close picker on outside click
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
    const input = inputRef.current
    if (!input) return
    const start = input.selectionStart ?? input.value.length
    const end = input.selectionEnd ?? input.value.length
    input.value = input.value.slice(0, start) + emoji.native + input.value.slice(end)
    // Restore cursor after inserted emoji
    const pos = start + emoji.native.length
    input.setSelectionRange(pos, pos)
    input.focus()
    setShowPicker(false)
  }

  const mutation = useMutation({
    mutationFn: (content: string) =>
      createComment(postId, content, replyingTo?.id),
    onSuccess: (newComment) => {
      // Append to cache immediately without waiting for refetch
      queryClient.setQueryData<Comment[]>(['comments', postId], (old = []) => {
        if (replyingTo) {
          // Insert reply into parent's replies array
          return old.map((c) => {
            if (c.id !== replyingTo.id) return c
            return { ...c, replies: [...(c.replies ?? []), newComment] }
          })
        }
        // New top-level comment
        return [...old, { ...newComment, replies: [] }]
      })
      // Invalidate so any in-flight or subsequent refetch reflects the new comment
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      // Update comment count on post
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })

      if (inputRef.current) inputRef.current.value = ''
      onCancelReply()
      toast(replyingTo ? 'Reply added' : 'Comment added')
      triggerInstall()
    },
    onError: (err) => toast(getApiError(err), 'error'),
  })

  function handleSubmit() {
    const content = inputRef.current?.value.trim()
    if (!content) return
    mutation.mutate(content)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      {/* Replying-to banner */}
      {replyingTo && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 border-b border-blue-100">
          <span className="text-[0.625rem] text-accent font-medium">
            Replying to {replyingTo.name}
          </span>
          <button
            onClick={onCancelReply}
            className="text-[0.625rem] text-muted hover:text-gray-600"
          >
            ✕ Cancel
          </button>
        </div>
      )}

      <div className="relative flex items-end gap-2 px-3 py-2.5">
        {/* Emoji picker popover */}
        {showPicker && emojiData && (
          <div ref={pickerRef} className="absolute bottom-full left-3 mb-1 z-50">
            <Suspense fallback={null}>
              <Picker
                data={emojiData}
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={1}
              />
            </Suspense>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          aria-label="Insert emoji"
          className="text-lg leading-none text-muted hover:text-gray-600 transition flex-shrink-0 hidden sm:block"
        >
          🙂
        </button>

        <textarea
          ref={inputRef}
          rows={1}
          placeholder={replyingTo ? `Reply to ${replyingTo.name}…` : 'Write a comment…'}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = `${el.scrollHeight}px`
          }}
          className="flex-1 text-xs border border-border rounded-xl px-4 py-2 bg-surface focus:outline-none focus:border-accent transition resize-none overflow-hidden leading-relaxed"
        />
        {focused && !showPicker && (
          <span className="hidden sm:block text-[0.625rem] text-muted whitespace-nowrap flex-shrink-0">
            Shift+Enter ↵ to send
          </span>
        )}
        <button
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm disabled:opacity-60 flex-shrink-0"
          aria-label="Send"
        >
          ↑
        </button>
      </div>
    </div>
  )
}
