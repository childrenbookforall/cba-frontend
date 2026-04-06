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
    searchParams.get('sort') === 'latest' ? 'latest' : 'top'
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
      <div className="bg-card border-b border-border px-4 py-2.5 flex items-center justify-between sticky top-0 z-10">
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
      <div className="flex items-center justify-end px-4 py-2 bg-gray-50 border-b border-gray-100">
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
          <p className="text-center text-xs text-muted py-12">
            No posts yet.{' '}
            <Link to="/posts/new" className="text-accent underline">
              Be the first to share something.
            </Link>
          </p>
        )}

        {pinnedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {/* Load more */}
        {hasNextPage && (
          <div className="flex justify-center py-4">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-6 py-2 rounded-full bg-surface border border-border text-xs font-semibold text-gray-600 hover:bg-gray-100 transition disabled:opacity-60"
            >
              {isFetchingNextPage ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>

      {/* FAB */}
      <Link
        to="/posts/new"
        className="fixed bottom-20 right-4 w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center shadow-lg z-20"
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
