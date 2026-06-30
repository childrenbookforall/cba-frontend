import { useState, useRef, useEffect } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { listAdminConversations, getAdminThread } from '../../api/admin'
import { formatRelativeTime } from '../../lib/utils'
import Avatar from '../../components/ui/Avatar'
import Spinner from '../../components/ui/Spinner'
import type { AdminConversation } from '../../api/admin'

function userName(u: { firstName: string; lastName?: string | null }) {
  return `${u.firstName}${u.lastName ? ` ${u.lastName}` : ''}`
}

export default function AdminMessagesPage() {
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [selectedConv, setSelectedConv] = useState<AdminConversation | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function selectConv(conv: AdminConversation | null) {
    if (selectedConv) {
      queryClient.removeQueries({ queryKey: ['admin-thread', selectedConv.userA.id, selectedConv.userB.id] })
    }
    setSelectedConv(conv)
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQ(q), 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [q])

  const {
    data: convData,
    isLoading: convLoading,
    isError: convError,
    fetchNextPage: fetchMoreConvs,
    hasNextPage: hasMoreConvs,
    isFetchingNextPage: fetchingMoreConvs,
  } = useInfiniteQuery({
    queryKey: ['admin-conversations', debouncedQ],
    queryFn: ({ pageParam }) => listAdminConversations(pageParam as string | undefined, debouncedQ || undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.hasMore ? page.nextCursor ?? undefined : undefined,
  })

  const conversations = convData?.pages.flatMap((p) => p.conversations) ?? []

  const {
    data: threadData,
    isLoading: threadLoading,
    isError: threadError,
    fetchNextPage: fetchMoreThread,
    hasNextPage: hasMoreThread,
    isFetchingNextPage: fetchingMoreThread,
  } = useInfiniteQuery({
    queryKey: ['admin-thread', selectedConv?.userA.id, selectedConv?.userB.id],
    queryFn: ({ pageParam }) =>
      getAdminThread(selectedConv!.userA.id, selectedConv!.userB.id, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.hasMore ? page.nextCursor ?? undefined : undefined,
    enabled: !!selectedConv,
  })

  const threadMessages = (threadData?.pages.flatMap((p) => p.messages) ?? []).reverse()

  if (selectedConv) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <button
          onClick={() => selectConv(null)}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-primary transition mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back to conversations
        </button>

        <div className="bg-card rounded-xl border border-border mb-4 px-4 py-3">
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            {userName(selectedConv.userA)} &amp; {userName(selectedConv.userB)}
          </p>
          <p className="text-[0.625rem] text-muted mt-0.5">{selectedConv.messageCount} messages</p>
        </div>

        {threadLoading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}

        {!threadLoading && threadError && (
          <p className="text-center text-xs text-danger py-8">Failed to load messages.</p>
        )}
        {!threadLoading && !threadError && threadMessages.length === 0 && (
          <p className="text-center text-xs text-muted py-8">No messages.</p>
        )}

        <div className="flex flex-col gap-3">
          {threadMessages.map((msg) => {
            const isA = msg.senderId === selectedConv.userA.id
            return (
              <div key={msg.id} className="bg-card border border-border rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Avatar
                    firstName={msg.sender.firstName}
                    lastName={msg.sender.lastName}
                    avatarUrl={msg.sender.avatarUrl}
                    size="sm"
                  />
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {userName(msg.sender)}
                  </span>
                  <span className={`text-[0.5rem] font-bold uppercase px-1.5 py-0.5 rounded ${isA ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'}`}>
                    {isA ? 'A' : 'B'}
                  </span>
                  <span className="text-[0.625rem] text-muted ml-auto">{formatRelativeTime(msg.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            )
          })}
        </div>

        {hasMoreThread && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => fetchMoreThread()}
              disabled={fetchingMoreThread}
              className="text-xs font-semibold text-accent-text disabled:opacity-50"
            >
              {fetchingMoreThread ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by user name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full text-sm border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-accent bg-surface"
        />
      </div>

      {convLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {!convLoading && convError && (
        <p className="text-center text-xs text-danger py-8">Failed to load conversations.</p>
      )}
      {!convLoading && !convError && conversations.length === 0 && (
        <p className="text-center text-xs text-muted py-8">No conversations found.</p>
      )}

      <div className="flex flex-col gap-2">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => selectConv(conv)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-left hover:bg-surface transition"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex -space-x-2">
                <Avatar firstName={conv.userA.firstName} lastName={conv.userA.lastName} avatarUrl={conv.userA.avatarUrl} size="sm" />
                <Avatar firstName={conv.userB.firstName} lastName={conv.userB.lastName} avatarUrl={conv.userB.avatarUrl} size="sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {userName(conv.userA)} &amp; {userName(conv.userB)}
                </p>
              </div>
              <span className="text-[0.625rem] text-muted flex-shrink-0">{formatRelativeTime(conv.updatedAt)}</span>
            </div>
            <div className="flex items-center gap-3">
              {conv.lastMessage && (
                <p className="text-[0.625rem] text-muted truncate flex-1">{conv.lastMessage.content}</p>
              )}
              <span className="text-[0.625rem] text-muted flex-shrink-0">{conv.messageCount} msgs</span>
            </div>
          </button>
        ))}
      </div>

      {hasMoreConvs && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => fetchMoreConvs()}
            disabled={fetchingMoreConvs}
            className="text-xs font-semibold text-accent-text disabled:opacity-50"
          >
            {fetchingMoreConvs ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
