import { Bookmark } from 'lucide-react'
import { useBookmarkMutation } from '../../hooks/useBookmarkMutation'
import type { Post } from '../../types/api'

interface BookmarkButtonProps {
  post: Post
}

export default function BookmarkButton({ post }: BookmarkButtonProps) {
  const mutation = useBookmarkMutation(post)
  const isBookmarked = post.isBookmarked

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Save for later'}
      title={isBookmarked ? 'Remove bookmark' : 'Save for later'}
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold transition ${
        mutation.isPending ? 'opacity-60' : ''
      } ${
        isBookmarked
          ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500 dark:text-yellow-400'
          : 'bg-surface text-muted hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-primary'
      }`}
    >
      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} strokeWidth={2} />
    </button>
  )
}
