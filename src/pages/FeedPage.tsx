import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useFeed } from '../hooks/useFeed'
import { useGroups } from '../hooks/useGroups'
import PostCard from '../components/feed/PostCard'
import PostListItem from '../components/feed/PostListItem'
import PostCardSkeleton from '../components/feed/PostCardSkeleton'
import SortPills from '../components/feed/SortPills'
import BottomNav from '../components/layout/BottomNav'
import NavLinks from '../components/layout/NavLinks'
import GroupsSidebar from '../components/layout/GroupsSidebar'
import GroupsSheet from '../components/ui/GroupsSheet'
import GroupMembersSheet from '../components/ui/GroupMembersSheet'
import { flattenGroups } from '../lib/groups'
import { useAuthStore } from '../stores/authStore'
import { useWindowVirtualizer } from '@tanstack/react-virtual'

type FeedView = 'card' | 'list'

function getSessionView(): FeedView {
  try {
    return sessionStorage.getItem('feed-view') === 'list' ? 'list' : 'card'
  } catch {
    return 'card'
  }
}

function getSidebarPref(): boolean {
  try {
    return localStorage.getItem('feed-sidebar') === 'open'
  } catch {
    return false
  }
}

export default function FeedPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sort: 'latest' | 'top' = searchParams.get('sort') === 'latest' ? 'latest' : 'top'
  const [groupId, setGroupId] = useState<string | null>(null)
  const [membersOpen, setMembersOpen] = useState(false)
  const [groupsSheetOpen, setGroupsSheetOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(getSidebarPref)
  const [view, setView] = useState<FeedView>(getSessionView)

  function toggleSidebar() {
    setSidebarOpen((v) => {
      const next = !v
      try { localStorage.setItem('feed-sidebar', next ? 'open' : 'closed') } catch { /* localStorage unavailable */ }
      return next
    })
  }

  function toggleView() {
    setView((v) => {
      const next = v === 'card' ? 'list' : 'card'
      try { sessionStorage.setItem('feed-view', next) } catch { /* sessionStorage unavailable */ }
      return next
    })
  }

  const { data: groups } = useGroups()
  const flatGroups = useMemo(() => flattenGroups(groups), [groups])

  const activeGroup = groupId
    ? flatGroups.find((g) => g.id === groupId)
    : flatGroups.length === 1 ? flatGroups[0] : null
  // Public groups have no meaningful member list — everyone has access
  const displayCount = activeGroup && !activeGroup.isPublic
    ? activeGroup._count?.members ?? null
    : null

  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  // In a view-only group, only admins can post — hide the create-post prompts
  const canPostHere = !activeGroup || isAdmin || !activeGroup.isViewOnly

  // If the selected group disappears from the response (made private, deleted,
  // or became a parent), fall back to All Groups instead of a stuck 403 feed
  useEffect(() => {
    if (groupId && groups && !flatGroups.some((g) => g.id === groupId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGroupId(null)
    }
  }, [groupId, groups, flatGroups])

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed({ sort, groupId })

  const pinnedPosts = useMemo(
    () => sort === 'top' ? (data?.pages[0]?.pinnedPosts ?? []) : [],
    [sort, data]
  )
  const posts = useMemo(() => data?.pages.flatMap((p) => p.posts) ?? [], [data])
  const allPosts = useMemo(() => [...pinnedPosts, ...posts], [pinnedPosts, posts])

  const listRef = useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  useLayoutEffect(() => {
    // sidebarOpen also moves the list: it shows/hides the group-picker bar above it
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScrollMargin(listRef.current?.offsetTop ?? 0)
  }, [groups, sidebarOpen])

  const virtualizer = useWindowVirtualizer({
    count: allPosts.length,
    estimateSize: () => view === 'list' ? 60 : 200,
    overscan: 5,
    scrollMargin,
  })

  function handleSortChange(newSort: 'latest' | 'top') {
    setSearchParams({ sort: newSort })
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

      <div className="md:flex md:max-w-5xl md:mx-auto">
      {/* Groups sidebar (desktop) */}
      {sidebarOpen && flatGroups.length > 1 && (
        <GroupsSidebar
          groups={groups ?? []}
          activeGroupId={groupId}
          onChange={handleGroupChange}
          onCollapse={toggleSidebar}
        />
      )}

      <div className="flex-1 min-w-0">
      {/* Group picker bar — opens the sheet on mobile, expands the sidebar on desktop
          (hidden on desktop while the sidebar is open; the sidebar has its own collapse button) */}
      {flatGroups.length > 1 && (
        <button
          type="button"
          onClick={() => {
            if (window.matchMedia('(min-width: 768px)').matches) toggleSidebar()
            else setGroupsSheetOpen(true)
          }}
          aria-label="Choose group"
          className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 min-h-[44px] bg-card border-b border-border text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-surface active:bg-surface transition-colors ${sidebarOpen ? 'md:hidden' : ''}`}
        >
          <span className="truncate">{activeGroup?.name ?? 'All Groups'}</span>
          <span className="flex-shrink-0 grid place-items-center w-6 h-6 rounded-md border border-border text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="7 15 12 20 17 15" />
              <polyline points="7 9 12 4 17 9" />
            </svg>
          </span>
        </button>
      )}

      {/* Sort bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-border">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleView}
            aria-label={view === 'card' ? 'Switch to list view' : 'Switch to card view'}
            className="p-1 rounded text-muted hover:text-primary transition-colors"
          >
            {view === 'card' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="3" cy="6" r="1" fill="currentColor" stroke="none" />
                <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none" />
                <circle cx="3" cy="18" r="1" fill="currentColor" stroke="none" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            )}
          </button>
          {displayCount !== null && (
            <button
              type="button"
              onClick={() => setMembersOpen(true)}
              className="text-[0.625rem] text-muted font-medium hover:text-primary transition-colors"
            >
              {displayCount} {displayCount === 1 ? 'member' : 'members'}
            </button>
          )}
        </div>
        <SortPills sort={sort} onChange={handleSortChange} />
      </div>

      {/* Feed */}
      <div className={`max-w-2xl mx-auto${view === 'card' ? ' pt-2' : ''}`}>
        {isLoading && (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-2 py-12">
            <p className="text-xs text-muted">Could not load posts.</p>
            <button onClick={() => refetch()} className="text-xs font-semibold text-accent-text">
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && allPosts.length === 0 && (
          <div className="text-center py-16 px-6">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nothing here yet!</p>
            {canPostHere ? (
              <>
                <p className="text-xs text-muted mb-4">Be the first to share a story with the community.</p>
                <Link
                  to={groupId ? `/posts/new?groupId=${groupId}` : '/posts/new'}
                  className="inline-block px-4 py-2 bg-accent text-accent-text-fg rounded-full text-xs font-semibold hover:opacity-90 transition"
                >
                  Share something
                </Link>
              </>
            ) : (
              <p className="text-xs text-muted">Only admins can post in this group.</p>
            )}
          </div>
        )}

        <div ref={listRef}>
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const post = allPosts[virtualItem.index]
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
                  }}
                >
                  {view === 'list'
                    ? <PostListItem post={post} index={virtualItem.index} />
                    : <PostCard post={post} index={virtualItem.index} />
                  }
                </div>
              )
            })}
          </div>
        </div>

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
      </div>
      </div>

      {/* FAB */}
      {canPostHere && (
      <Link
        to={groupId ? `/posts/new?groupId=${groupId}` : '/posts/new'}
        className="fixed bottom-20 right-4 w-12 h-12 bg-accent text-accent-text-fg rounded-full flex items-center justify-center shadow-lg shadow-accent/40 z-20 hover:scale-110 active:scale-95 transition-transform"
        aria-label="New post"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>
      )}

      <BottomNav />

      <GroupMembersSheet
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        groupId={activeGroup?.id ?? null}
        groupName={activeGroup?.name}
      />

      <GroupsSheet
        open={groupsSheetOpen}
        onClose={() => setGroupsSheetOpen(false)}
        groups={groups ?? []}
        activeGroupId={groupId}
        onChange={handleGroupChange}
      />
    </div>
  )
}
