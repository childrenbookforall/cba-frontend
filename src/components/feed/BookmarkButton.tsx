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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill={isBookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}
