import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useFeed } from '../hooks/useFeed'
import { useGroups } from '../hooks/useGroups'
import PostCard from '../components/feed/PostCard'
import PostCardSkeleton from '../components/feed/PostCardSkeleton'
import GroupTabs from '../components/feed/GroupTabs'
import SortPills from '../components/feed/SortPills'
import BottomNav from '../components/layout/BottomNav'
import NavLinks from '../components/layout/NavLinks'

export default function FeedPage() {
  const [searchParams] = useSearchParams()
  const [sort, setSort] = useState<'latest' | 'top'>(
    searchParams.get('sort') === 'top' ? 'top' : 'latest'
  )
  const [groupId, setGroupId] = useState<string | null>(null)

  const { data: groups } = useGroups()

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed({ sort, groupId })

  const pinnedPosts = sort === 'top' ? (data?.pages[0]?.pinnedPosts ?? []) : []
  const posts = data?.pages.flatMap((p) => p.posts) ?? []

  function handleSortChange(newSort: 'latest' | 'top') {
    setSort(newSort)
    window.scrollTo({ top: 0 })
  }

  function handleGroupChange(newGroupId: string | null) {
    setGroupId(newGroupId)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="min-h-svh bg-surface pb-20 sm:pb-0">
      <title>Community - CBA</title>
      {/* Top nav */}
      <div className="bg-card border-b border-border border-t-[3px] border-t-accent px-4 py-2.5 flex items-center justify-between sticky top-0 z-10">
        <Link to="/feed"><img src={logo} alt="Children's Book for All" className="h-8 object-contain" /></Link>
        <NavLinks />
      </div>

      {/* Group tabs */}
      {groups && groups.length > 1 && (
        <GroupTabs
          groups={groups}
          activeGroupId={groupId}
          onChange={handleGroupChange}
        />
      )}

      {/* Sort bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-border">
        {(() => {
          const activeGroup = groupId
            ? groups?.find((g) => g.id === groupId)
            : groups?.length === 1 ? groups[0] : null
          if (!activeGroup?._count) return <span />
          const displayCount = Math.max(0, activeGroup._count.members - 1)
          return (
            <span className="text-[0.625rem] text-muted font-medium">
              {displayCount} {displayCount === 1 ? 'member' : 'members'}
            </span>
          )
        })()}
        <SortPills sort={sort} onChange={handleSortChange} />
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto pt-2">
        {isLoading && (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        )}

        {isError && (
          <p className="text-center text-xs text-muted py-8">
            Could not load posts. Please try again later.
          </p>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="text-center py-16 px-6">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nothing here yet!</p>
            <p className="text-xs text-muted mb-4">Be the first to share a story with the community.</p>
            <Link to="/posts/new" className="inline-block px-4 py-2 bg-accent text-white rounded-full text-xs font-semibold hover:opacity-90 transition">
              Share something
            </Link>
          </div>
        )}

        {pinnedPosts.map((post, i) => (
          <PostCard key={post.id} post={post} index={i} />
        ))}

        {posts.map((post, i) => (
          <PostCard key={post.id} post={post} index={pinnedPosts.length + i} />
        ))}

        {/* Load more */}
        {hasNextPage && (
          <div className="flex justify-center py-4">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-6 py-2 rounded-full bg-surface border border-border text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition disabled:opacity-60"
            >
              {isFetchingNextPage ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>

      {/* FAB */}
      <Link
        to="/posts/new"
        className="fixed bottom-20 right-4 w-12 h-12 bg-gradient-to-br from-[#5c8c7a] to-[#7ab5a0] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#5c8c7a]/40 z-20 hover:scale-110 active:scale-95 transition-transform"
        aria-label="New post"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>

      <BottomNav />
    </div>
  )
}
