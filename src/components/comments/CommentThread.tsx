import CommentItem from './CommentItem'
import type { Comment } from '../../types/api'

interface CommentThreadProps {
  comments: Comment[]
  postId: string
  groupId?: string
  onReply: (commentId: string, name: string) => void
}

export default function CommentThread({ comments, postId, groupId, onReply }: CommentThreadProps) {
  if (comments.length === 0) {
    return (
      <p className="text-xs text-muted text-center py-6">
        No comments yet. Be the first to share your thoughts.
      </p>
    )
  }

  return (
    <div>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postId={postId}
          groupId={groupId}
          onReply={onReply}
        />
      ))}
    </div>
  )
}
