import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConversation, sendMessage, markRead } from '../api/messages'
import { getUserById, getMe } from '../api/users'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../stores/toastStore'
import { getApiError, formatRelativeTime } from '../lib/utils'
import Avatar from '../components/ui/Avatar'
import Spinner from '../components/ui/Spinner'
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
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['conversation', userId],
    queryFn: ({ pageParam }) => getConversation(userId!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
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
      const { user, token, setAuth } = useAuthStore.getState()
      if (!user?.canInitiateMessages) {
        getMe().then((updated) => { if (token) setAuth(token, updated) }).catch(() => {})
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
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
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
          <p className="text-center text-xs text-muted py-8">Could not load messages.</p>
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
                    ? 'bg-teal-600 text-white rounded-br-sm'
                    : 'bg-card text-gray-800 dark:text-gray-200 rounded-bl-sm border border-border'
                } ${msg.id.startsWith('optimistic-') ? 'opacity-60' : ''}`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-[0.5rem] mt-1 ${isMine ? 'text-white/70' : 'text-muted'}`}>
                  {formatRelativeTime(msg.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="fixed bottom-0 inset-x-0 z-10 bg-card border-t border-border px-3 py-2 flex items-end gap-2">
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
          className="flex-shrink-0 w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white disabled:opacity-40 transition"
          aria-label="Send"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
