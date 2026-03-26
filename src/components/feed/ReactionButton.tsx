import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { upsertReaction, removeReaction } from '../../api/reactions'
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
    },
  })

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      title={label}
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition ${
        isActive ? activeClass : 'bg-surface text-muted hover:bg-gray-100'
      } disabled:opacity-60`}
    >
      <span>{emoji}</span>
      {count > 0 && <span>{count}</span>}
    </button>
  )
}
