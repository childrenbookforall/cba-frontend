import LinkPreview from './LinkPreview'
import MediaCarousel from './MediaCarousel'
import MentionText from '../ui/MentionText'
import { textAlign } from '../../lib/utils'
import type { Post } from '../../types/api'

interface PostBodyProps {
  post: Post
  compact?: boolean
}

export default function PostBody({ post, compact = false }: PostBodyProps) {
  const textCls = compact
    ? 'text-xs text-gray-500 dark:text-gray-300'
    : 'text-sm text-gray-600 dark:text-gray-300'
  const mediaUrls = post.mediaUrls?.length ? post.mediaUrls : post.mediaUrl ? [post.mediaUrl] : null

  return (
    <>
      {post.type === 'text' && post.content && (
        <p className={`${textCls} mt-1 leading-relaxed whitespace-pre-wrap${compact ? ' line-clamp-3' : ''}`}>
          <MentionText content={post.content} />
        </p>
      )}

      {post.type === 'link' && post.linkUrl && (
        <LinkPreview
          url={post.linkUrl}
          previewImage={post.linkPreviewImage}
          previewTitle={post.linkPreviewTitle}
          previewDescription={post.linkPreviewDescription}
        />
      )}

      {post.type === 'link' && post.content && (
        <p className={`${textCls} ${compact ? 'mt-1.5' : 'mt-2'} leading-relaxed whitespace-pre-wrap${compact ? ' line-clamp-3' : ''} ${textAlign(post.content)}`}>
          <MentionText content={post.content} />
        </p>
      )}

      {post.type === 'photo' && mediaUrls && (
        <>
          {compact ? (
            <div onClick={(e) => e.preventDefault()}>
              <MediaCarousel urls={mediaUrls} alt={post.title} compact postUrl={`/posts/${post.id}`} />
            </div>
          ) : (
            <MediaCarousel urls={mediaUrls} alt={post.title} />
          )}
          {post.content && (
            <p className={`${textCls}${compact ? ' mt-1 line-clamp-3' : ''} leading-relaxed whitespace-pre-wrap ${textAlign(post.content)}`}>
              <MentionText content={post.content} />
            </p>
          )}
        </>
      )}
    </>
  )
}
