import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { searchPosts } from '../api/posts'
import { getApiError } from '../lib/utils'
import PostCard from '../components/feed/PostCard'
import PostCardSkeleton from '../components/feed/PostCardSkeleton'
import NavLinks from '../components/layout/NavLinks'
import BottomNav from '../components/layout/BottomNav'
import type { Post } from '../types/api'

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQ)
  const [results, setResults] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Capture initialQ at mount so the effect below doesn't need it as a dep
  const initialQRef = useRef(initialQ)

  const runSearch = useCallback(async (q: string) => {
    setIsLoading(true)
    setSearched(true)
    setError(null)
    try {
      const posts = await searchPosts(q)
      setResults(posts)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Run search on initial load if q param is present.
  // runSearch is stable (useCallback []) so this effect truly runs once.
  useEffect(() => {
    if (initialQRef.current) runSearch(initialQRef.current)
    else inputRef.current?.focus()
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [runSearch])

  const handleChange = useCallback((q: string) => {
    setQuery(q)
    setError(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!q.trim()) {
      setResults([])
      setSearched(false)
      setSearchParams({})
      return
    }

    debounceRef.current = setTimeout(() => {
      setSearchParams({ q: q.trim() })
      runSearch(q.trim())
    }, 350)
  }, [runSearch, setSearchParams])

  return (
    <div className="min-h-svh bg-surface pb-20 sm:pb-0">
      <title>Search - CBA</title>

      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-700 transition"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search posts…"
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

        {error && (
          <p className="text-center text-xs text-muted py-8">
            {error}
          </p>
        )}

        {!isLoading && !error && searched && results.length === 0 && (
          <p className="text-center text-xs text-muted py-12">
            No posts found for "<span className="font-medium">{query}</span>"
          </p>
        )}

        {!isLoading && !error && !searched && (
          <p className="text-center text-xs text-muted py-12">
            Start typing to search posts
          </p>
        )}

        {!isLoading && results.length > 0 && (
          <>
            <p className="text-[0.625rem] text-muted px-4 pb-2">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
            {results.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
