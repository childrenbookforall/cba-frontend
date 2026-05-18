import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchSavedPosts } from '../api/bookmarks'
import PostCard from '../components/feed/PostCard'
import Spinner from '../components/ui/Spinner'
import BackButton from '../components/ui/BackButton'
import NavLinks from '../components/layout/NavLinks'
import BottomNav from '../components/layout/BottomNav'

export default function SavedPostsPage() {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 350)
    return () => clearTimeout(t)
  }, [input])

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['saved', q],
      queryFn: ({ pageParam }) => fetchSavedPosts(pageParam as string | undefined, q || undefined),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      staleTime: 30_000,
    })

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage() },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const posts = data?.pages.flatMap((p) => p.posts ?? []) ?? []

  return (
    <div className="min-h-svh bg-surface flex flex-col pb-20 sm:pb-0">
      <title>Saved - CBA</title>
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <BackButton fallback="/feed" />
        <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex-1">Saved</h1>
        <NavLinks />
      </div>

      <div className="max-w-2xl mx-auto w-full px-3 pt-3">
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Filter saved posts…"
          className="w-full text-sm bg-card border border-border rounded-xl px-4 py-2 text-gray-900 dark:text-gray-100 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full pt-2">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-2 py-16">
            <p className="text-xs text-muted">Could not load saved posts.</p>
            <button onClick={() => refetch()} className="text-xs font-semibold text-accent-text">
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && posts.length === 0 && (
          <p className="text-center text-xs text-muted py-16">
            {q ? `No saved posts match "${q}".` : 'No saved posts yet. Tap the bookmark icon on any post to save it.'}
          </p>
        )}

        {posts.map((post, i) => (
          <PostCard key={post.id} post={post} index={i} />
        ))}

        <div ref={sentinelRef} className="h-4" />

        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
