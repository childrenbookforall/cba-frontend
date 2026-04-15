import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { upsertReaction, removeReaction, getReactors } from '../../api/reactions'
import { useInstallPromptStore } from '../../stores/installPromptStore'
import type { Post, ReactionType, FeedResult } from '../../types/api'

type InfiniteFeed = InfiniteData<FeedResult>

function applyReactionToPost(p: Post, type: ReactionType): Post {
  const wasActive = p.myReaction === type
  const prevType = p.myReaction
  return {
    ...p,
    myReaction: wasActive ? null : type,
    withYouCount: p.withYouCount
      + (type === 'with_you' && !wasActive ? 1 : 0)
      - (prevType === 'with_you' ? 1 : 0),
    helpedMeCount: p.helpedMeCount
      + (type === 'helped_me' && !wasActive ? 1 : 0)
      - (prevType === 'helped_me' ? 1 : 0),
    hugCount: p.hugCount
      + (type === 'hug' && !wasActive ? 1 : 0)
      - (prevType === 'hug' ? 1 : 0),
    _count: {
      ...p._count,
      reactions: p._count.reactions + (wasActive ? -1 : prevType ? 0 : 1),
    },
  }
}

interface ReactionButtonProps {
  post: Post
  type: ReactionType
}

const config = {
  with_you: {
    emoji: '💛',
    label: 'With You',
    activeClass: 'bg-yellow-50 text-yellow-500',
  },
  helped_me: {
    emoji: '🌱',
    label: 'This Helped Me',
    activeClass: 'bg-green-50 text-reaction-hm',
  },
  hug: {
    emoji: '🫂',
    label: 'Hug',
    activeClass: 'bg-orange-50 text-orange-400',
  },
}

export default function ReactionButton({ post, type }: ReactionButtonProps) {
  const queryClient = useQueryClient()
  const triggerInstall = useInstallPromptStore((s) => s.trigger)
  const isActive = post.myReaction === type
  const { emoji, label, activeClass } = config[type]
  const count = type === 'with_you' ? post.withYouCount : type === 'helped_me' ? post.helpedMeCount : post.hugCount

  const [showPopover, setShowPopover] = useState(false)
  const [popKey, setPopKey] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: reactorsData, isLoading: reactorsLoading } = useQuery({
    queryKey: ['reactions', post.id],
    queryFn: () => getReactors(post.id),
    enabled: showPopover,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!showPopover) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPopover(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPopover])

  const mutation = useMutation({
    mutationFn: async () => {
      if (isActive) return removeReaction(post.id)
      await upsertReaction(post.id, type)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      await queryClient.cancelQueries({ queryKey: ['post', post.id] })

      const prevPost = queryClient.getQueryData<Post>(['post', post.id])
      const prevFeedSnapshots = new Map<unknown, InfiniteFeed>()

      queryClient.setQueriesData<InfiniteFeed>(
        { queryKey: ['feed'], exact: false },
        (old) => {
          if (!old) return old
          prevFeedSnapshots.set(old, old)
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              pinnedPosts: page.pinnedPosts.map((p) =>
                p.id !== post.id ? p : applyReactionToPost(p, type)
              ),
              posts: page.posts.map((p) =>
                p.id !== post.id ? p : applyReactionToPost(p, type)
              ),
            })),
          }
        }
      )

      queryClient.setQueryData<Post>(['post', post.id], (old) =>
        old ? applyReactionToPost(old, type) : old
      )

      return { prevPost, prevFeedSnapshots }
    },
    onError: (_err, _vars, context) => {
      if (context?.prevPost !== undefined) {
        queryClient.setQueryData(['post', post.id], context.prevPost)
      }
      context?.prevFeedSnapshots.forEach((snapshot) => {
        queryClient.setQueriesData<InfiniteFeed>(
          { queryKey: ['feed'], exact: false },
          () => snapshot
        )
      })
    },
    onSuccess: () => {
      if (!isActive) triggerInstall()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', post.id] })
      queryClient.removeQueries({ queryKey: ['reactions', post.id] })
    },
  })

  const reactorGroup = reactorsData?.[type]
  const reactors = reactorGroup?.users ?? []
  const remaining = (reactorGroup?.total ?? 0) - reactors.length

  return (
    <div className="relative" ref={containerRef}>
      <div className={`inline-flex items-center rounded-full text-xs font-semibold transition ${
        isActive ? activeClass : 'bg-surface text-muted'
      } ${mutation.isPending ? 'opacity-60' : ''}`}>
        <button
          type="button"
          onClick={() => { if (!isActive) setPopKey((k) => k + 1); mutation.mutate() }}
          disabled={mutation.isPending}
          title={label}
          className={`flex items-center ${count > 0 ? 'pl-2 pr-1' : 'px-2'} py-1 rounded-full transition ${!isActive ? 'hover:bg-gray-100' : ''}`}
        >
          <span key={popKey} className={popKey > 0 ? 'animate-reaction-pop inline-block' : 'inline-block'}>{emoji}</span>
        </button>
        {count > 0 && (
          <>
            <span className="w-px self-stretch bg-black/10 my-1" />
            <button
              type="button"
              onClick={() => setShowPopover((v) => !v)}
              className="pr-2 pl-1.5 py-1 hover:underline"
            >
              {count}
            </button>
          </>
        )}
      </div>

      {showPopover && (
        <div className="absolute bottom-full left-0 mb-1.5 z-50 bg-card border border-border rounded-xl shadow-lg p-3 min-w-[150px] max-w-[220px]">
          <p className="text-[0.625rem] font-bold text-muted uppercase tracking-wide mb-2">{emoji} {label}</p>
          {reactorsLoading ? (
            <p className="text-xs text-muted">Loading…</p>
          ) : (
            <>
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {reactors.map((r) => (
                  <li key={r.id} className="text-xs text-gray-800">
                    {r.firstName}{r.lastName ? ` ${r.lastName}` : ''}
                  </li>
                ))}
              </ul>
              {remaining > 0 && (
                <p className="text-[0.625rem] text-muted mt-2">and {remaining} more</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
