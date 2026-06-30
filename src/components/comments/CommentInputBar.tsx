import { useRef, useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { CornerDownRight, SendHorizonal } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createComment } from '../../api/comments'
import { getApiError } from '../../lib/utils'
import { useToast } from '../../stores/toastStore'
import { useInstallPromptStore } from '../../stores/installPromptStore'
import { useThemeStore } from '../../stores/themeStore'
import { useEmojiPicker } from '../../hooks/useEmojiPicker'
import MentionTextarea, { type MentionTextareaHandle } from '../ui/MentionTextarea'
import EmojiPickerErrorBoundary from '../ui/EmojiPickerErrorBoundary'
import type { Comment } from '../../types/api'

const Picker = lazy(() => import('@emoji-mart/react'))

interface ReplyingTo {
  id: string
  name: string
}

interface CommentInputBarProps {
  postId: string
  groupId?: string
  replyingTo: ReplyingTo | null
  onCancelReply: () => void
}

export default function CommentInputBar({ postId, groupId, replyingTo, onCancelReply }: CommentInputBarProps) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const setInputRef = useCallback((el: HTMLTextAreaElement | null) => { inputRef.current = el }, [])
  const mentionRef = useRef<MentionTextareaHandle>(null)
  const queryClient = useQueryClient()
  const toast = useToast()
  const triggerInstall = useInstallPromptStore((s) => s.trigger)
  const theme = useThemeStore((s) => s.theme)
  const [focused, setFocused] = useState(false)
  const [commentText, setCommentText] = useState('')

  const { showPicker, setShowPicker, pickerRef, emojiData, handleEmojiSelect } = useEmojiPicker(
    (text) => mentionRef.current?.insertText(text)
  )

  useEffect(() => {
    if (replyingTo) inputRef.current?.focus()
  }, [replyingTo])

  const mutation = useMutation({
    mutationFn: (content: string) =>
      createComment(postId, content, replyingTo?.id),
    onSuccess: (newComment) => {
      queryClient.setQueryData<Comment[]>(['comments', postId], (old = []) => {
        if (replyingTo) {
          return old.map((c) => {
            if (c.id !== replyingTo.id) return c
            return { ...c, replies: [...(c.replies ?? []), newComment] }
          })
        }
        return [...old, { ...newComment, replies: [] }]
      })
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })

      setCommentText('')
      if (inputRef.current) inputRef.current.style.height = 'auto'
      onCancelReply()
      toast(replyingTo ? 'Reply added' : 'Comment added')
      triggerInstall()
    },
    onError: (err) => toast(getApiError(err), 'error'),
  })

  function handleSubmit() {
    const content = commentText.trim()
    if (!content) return
    mutation.mutate(content)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      {replyingTo && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-surface border-b border-border">
          <span className="flex items-center gap-1 text-[0.625rem] text-accent-text font-medium">
            <CornerDownRight size={14} strokeWidth={2.5} className="text-accent-text flex-shrink-0" />
            Replying to {replyingTo.name}
          </span>
          <button
            onClick={onCancelReply}
            aria-label="Cancel reply"
            className="text-[0.625rem] text-muted hover:text-primary min-h-[44px] px-2"
          >
            ✕ Cancel
          </button>
        </div>
      )}

      <div className="relative flex items-end gap-2 px-3 py-2.5">
        {showPicker && emojiData && (
          <div ref={pickerRef} className="absolute bottom-full left-3 mb-1 z-50">
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

        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          aria-label="Insert emoji"
          className="text-lg leading-none text-muted hover:text-primary transition flex-shrink-0 hidden sm:block"
        >
          🙂
        </button>

        <MentionTextarea
          ref={mentionRef}
          value={commentText}
          onChange={setCommentText}
          groupId={groupId}
          placeholder={replyingTo ? `Reply to ${replyingTo.name}…` : 'Write a comment…'}
          rows={1}
          wrapperClassName="flex-1"
          className="w-full text-xs border border-border rounded-xl px-4 py-2 bg-surface focus:outline-none focus:border-accent transition resize-none overflow-hidden leading-relaxed"
          textareaRef={setInputRef}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = `${el.scrollHeight}px`
          }}
        />

        {focused && !showPicker && (
          <span className="hidden sm:block text-[0.625rem] text-muted whitespace-nowrap flex-shrink-0">
            Shift+Enter ↵ to send
          </span>
        )}
        <button
          onClick={handleSubmit}
          disabled={mutation.isPending || !commentText.trim()}
          className="w-8 h-8 rounded-full bg-accent text-accent-text-fg flex items-center justify-center text-sm disabled:opacity-60 flex-shrink-0"
          aria-label="Send"
        >
          <SendHorizonal size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
