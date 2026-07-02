import { useState, useRef, useEffect, useCallback } from 'react'
import { Send } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConversation, sendMessage, markRead } from '../api/messages'
import { getUserById, getMe } from '../api/users'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../stores/toastStore'
import { getApiError, formatRelativeTime } from '../lib/utils'
import Avatar from '../components/ui/Avatar'
import Spinner from '../components/ui/Spinner'
import BackButton from '../components/ui/BackButton'
import NavLinks from '../components/layout/NavLinks'
import type { DirectMessage } from '../types/api'

export default function ConversationPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const me = useAuthStore((s) => s.user?.id)
  const toast = useToast()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const didMarkRead = useRef(false)
  const initialLoadDone = useRef(false)
  const justSent = useRef(false)

  useEffect(() => {
    initialLoadDone.current = false
    justSent.current = false
    didMarkRead.current = false
  }, [userId])

  const { data: otherUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId!),
    enabled: !!userId,
  })

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['conversation', userId],
    queryFn: ({ pageParam }) => getConversation(userId!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })

  const messages: DirectMessage[] = (data?.pages ?? [])
    .flatMap((p) => p.messages)
    .slice()
    .reverse()

  useEffect(() => {
    if (!didMarkRead.current && userId) {
      didMarkRead.current = true
      markRead(userId)
        .then(() => queryClient.invalidateQueries({ queryKey: ['messages'] }))
        .catch(() => {})
    }
  }, [userId, queryClient])

  useEffect(() => {
    if (!isLoading && messages.length > 0 && !initialLoadDone.current) {
      initialLoadDone.current = true
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
      return
    }
    if (justSent.current) {
      justSent.current = false
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, isLoading])

  const onScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    if (el.scrollTop < 80 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendMessage(userId!, text),
    onMutate: async (text) => {
      const optimistic: DirectMessage = {
        id: `optimistic-${Date.now()}`,
        conversationId: '',
        senderId: me ?? '',
        content: text,
        isRead: false,
        createdAt: new Date().toISOString(),
      }
      queryClient.setQueryData<typeof data>(['conversation', userId], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page, i) =>
            i === 0
              ? { ...page, messages: [optimistic, ...page.messages] }
              : page
          ),
        }
      })
      return { optimistic }
    },
    onError: (_err, _text, context) => {
      queryClient.setQueryData<typeof data>(['conversation', userId], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.filter((m) => m.id !== context?.optimistic.id),
          })),
        }
      })
      toast(getApiError(_err), 'error')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', userId] })
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      const { user, setAuth } = useAuthStore.getState()
      if (!user?.canInitiateMessages) {
        getMe().then((updated) => {
          const { token: currentToken } = useAuthStore.getState()
          if (currentToken) setAuth(currentToken, updated)
        }).catch(() => {})
      }
    },
  })

  function handleSend() {
    const text = content.trim()
    if (!text || !me || sendMutation.isPending) return
    justSent.current = true
    setContent('')
    sendMutation.mutate(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const otherName = otherUser
    ? `${otherUser.firstName}${otherUser.lastName ? ` ${otherUser.lastName}` : ''}`
    : '…'

  return (
    <div className="min-h-svh bg-surface flex flex-col">
      <title>{otherName} - CBA</title>

      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <BackButton fallback="/messages" />
        {otherUser && (
          <button
            onClick={() => navigate(`/profile/${userId}`)}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <Avatar
              firstName={otherUser.firstName}
              lastName={otherUser.lastName}
              avatarUrl={otherUser.avatarUrl}
              size="sm"
            />
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{otherName}</span>
          </button>
        )}
        <div className="flex-1" />
        <NavLinks />
      </div>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-4 py-4 pb-28 flex flex-col gap-2"
      >
        {(isLoading) && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-2 py-8">
            <p className="text-xs text-muted">Could not load messages.</p>
            <button onClick={() => refetch()} className="text-xs font-semibold text-accent-text">
              Try again
            </button>
          </div>
        )}

        {isFetchingNextPage && (
          <div className="flex justify-center pb-2">
            <Spinner size="sm" />
          </div>
        )}

        {!isLoading && !isError && messages.length === 0 && (
          <div className="flex flex-col items-center gap-1 py-8">
            <p className="text-xs text-muted">No messages yet. Say hello!</p>
            <p className="text-[0.625rem] text-muted italic">This is not a live chat – messages may take time to deliver</p>
          </div>
        )}

        {messages.length > 0 && (
          <p className="text-center text-[0.625rem] text-muted italic py-2">This is not a live chat – messages may take time to deliver</p>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === me
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  isMine
                    ? 'bg-accent text-accent-text-fg rounded-br-sm'
                    : 'bg-card text-gray-800 dark:text-gray-200 rounded-bl-sm border border-border'
                } ${msg.id.startsWith('optimistic-') ? 'opacity-60' : ''}`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-[0.5rem] mt-1 ${isMine ? 'text-accent-text-fg/70' : 'text-muted'}`}>
                  {formatRelativeTime(msg.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="fixed bottom-0 inset-x-0 z-10 bg-card border-t border-border px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); autoResize(e.target) }}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          rows={1}
          className="flex-1 text-sm bg-surface border border-border rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-accent leading-relaxed overflow-hidden"
          style={{ minHeight: '38px', maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || sendMutation.isPending}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-accent flex items-center justify-center text-accent-text-fg disabled:opacity-40 transition"
          aria-label="Send"
        >
          <Send className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
