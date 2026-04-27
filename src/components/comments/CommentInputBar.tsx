import { useRef, useEffect, useState, lazy, Suspense } from 'react'
import { CornerDownRight, SendHorizonal } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createComment } from '../../api/comments'

const Picker = lazy(() => import('@emoji-mart/react'))
import { getApiError } from '../../lib/utils'
import { useToast } from '../../stores/toastStore'
import { useInstallPromptStore } from '../../stores/installPromptStore'
import { useThemeStore } from '../../stores/themeStore'
import MentionTextarea, { type MentionTextareaHandle } from '../ui/MentionTextarea'
import type { Comment } from '../../types/api'

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
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const mentionRef = useRef<MentionTextareaHandle>(null)
  const queryClient = useQueryClient()
  const toast = useToast()
  const triggerInstall = useInstallPromptStore((s) => s.trigger)
  const theme = useThemeStore((s) => s.theme)
  const [focused, setFocused] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [emojiData, setEmojiData] = useState<any>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const [commentText, setCommentText] = useState('')

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
    mentionRef.current?.insertText(emoji.native)
    setShowPicker(false)
  }

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
      {/* Replying-to banner */}
      {replyingTo && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-surface border-b border-border">
          <span className="flex items-center gap-1 text-[0.625rem] text-accent font-medium">
            <CornerDownRight size={14} strokeWidth={2.5} className="text-accent flex-shrink-0" />
            Replying to {replyingTo.name}
          </span>
          <button
            onClick={onCancelReply}
            className="text-[0.625rem] text-muted hover:text-primary"
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
                theme={theme}
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
          textareaRef={inputRef}
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
          disabled={mutation.isPending}
          className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm disabled:opacity-60 flex-shrink-0"
          aria-label="Send"
        >
          <SendHorizonal size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
