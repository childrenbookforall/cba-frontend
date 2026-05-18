import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMessages } from '../hooks/useMessages'
import { searchUsers } from '../api/users'
import Avatar from '../components/ui/Avatar'
import Spinner from '../components/ui/Spinner'
import BackButton from '../components/ui/BackButton'
import BottomNav from '../components/layout/BottomNav'
import NavLinks from '../components/layout/NavLinks'
import { formatRelativeTime } from '../lib/utils'
import type { PostUser } from '../types/api'

export default function MessagesPage() {
  const navigate = useNavigate()
  const { data: conversations, isLoading, isError, refetch } = useMessages()
  const [composing, setComposing] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<PostUser[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!composing) {
      setSearchQ('')
      setSearchResults([])
    }
  }, [composing])

  useEffect(() => {
    if (!searchQ.trim()) {
      setSearchResults([])
      return
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchUsers(searchQ.trim())
        setSearchResults(results)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [searchQ])

  return (
    <div className="min-h-svh bg-surface flex flex-col pb-20 sm:pb-0">
      <title>Messages - CBA</title>

      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <BackButton fallback="/feed" />
        <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex-1">Messages</h1>
        <NavLinks />
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full">
        <div className="flex justify-end px-4 pt-3">
          <button
            onClick={() => setComposing(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent-text hover:opacity-80 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New
          </button>
        </div>
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-2 py-16">
            <p className="text-xs text-muted">Could not load messages.</p>
            <button onClick={() => refetch()} className="text-xs font-semibold text-accent-text">
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && (conversations?.length ?? 0) === 0 && (
          <p className="text-center text-xs text-muted py-16">No messages yet.</p>
        )}

        {!isLoading && !isError && (conversations?.length ?? 0) > 0 && (
          <div className="bg-card mt-2">
            {conversations!.map((conv) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/messages/${conv.otherUser.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0 hover:bg-surface transition text-left"
              >
                <div className="relative flex-shrink-0">
                  <Avatar
                    firstName={conv.otherUser.firstName}
                    lastName={conv.otherUser.lastName}
                    avatarUrl={conv.otherUser.avatarUrl}
                    size="md"
                  />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent border-2 border-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold truncate ${conv.unreadCount > 0 ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                      {conv.otherUser.firstName}{conv.otherUser.lastName ? ` ${conv.otherUser.lastName}` : ''}
                    </span>
                    <span className="text-[0.625rem] text-muted flex-shrink-0">
                      {formatRelativeTime(conv.updatedAt)}
                    </span>
                  </div>
                  {conv.lastMessage && (
                    <p className={`text-[0.625rem] truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-muted'}`}>
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-accent text-accent-text-fg text-[0.5rem] font-bold flex items-center justify-center px-1">
                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      {/* Compose modal */}
      {composing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
          <div className="bg-card rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">New message</h2>
              <button
                onClick={() => setComposing(false)}
                className="text-muted hover:text-primary transition"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="px-4 py-3">
              <input
                autoFocus
                type="text"
                placeholder="Search by name…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-accent bg-surface"
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {searching && (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              )}
              {!searching && searchQ.trim() && searchResults.length === 0 && (
                <p className="text-center text-xs text-muted py-4">No users found.</p>
              )}
              {!searching && searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setComposing(false); navigate(`/messages/${u.id}`) }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface transition text-left border-b border-border last:border-0"
                >
                  <Avatar firstName={u.firstName} lastName={u.lastName} avatarUrl={u.avatarUrl} size="sm" />
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {u.firstName}{u.lastName ? ` ${u.lastName}` : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
