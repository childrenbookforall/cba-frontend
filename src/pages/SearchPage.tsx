import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { searchPosts } from '../api/posts'
import PostCard from '../components/feed/PostCard'
import PostCardSkeleton from '../components/feed/PostCardSkeleton'
import NavLinks from '../components/layout/NavLinks'
import BottomNav from '../components/layout/BottomNav'

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQ)
  const [committedQuery, setCommittedQuery] = useState(initialQ)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['search', committedQuery],
    queryFn: ({ pageParam, signal }) => searchPosts(committedQuery, pageParam as string | undefined, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: committedQuery.trim().length > 0,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!initialQ) inputRef.current?.focus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const handleChange = useCallback((q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setCommittedQuery('')
      setSearchParams({})
      return
    }
    debounceRef.current = setTimeout(() => {
      setCommittedQuery(q.trim())
      setSearchParams({ q: q.trim() })
    }, 350)
  }, [setSearchParams])

  const posts = data?.pages.flatMap((p) => p.posts) ?? []
  const searched = committedQuery.trim().length > 0

  return (
    <div className="min-h-svh bg-surface pb-20 sm:pb-0">
      <title>Search - CBA</title>

      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search posts… or @name for author"
          className="flex-1 text-sm bg-surface border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
        />

        <NavLinks />
      </div>

      {/* Results */}
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
            Something went wrong. Please try again.
          </p>
        )}

        {!isLoading && !isError && searched && posts.length === 0 && (
          <p className="text-center text-xs text-muted py-12">
            No posts found for "<span className="font-medium">{committedQuery}</span>"
          </p>
        )}

        {!searched && (
          <p className="text-center text-xs text-muted py-12">
            Start typing to search posts
          </p>
        )}

        {posts.length > 0 && (
          <>
            <p className="text-[0.625rem] text-muted px-4 pb-2">
              {posts.length} result{posts.length !== 1 ? 's' : ''}
            </p>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
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
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
