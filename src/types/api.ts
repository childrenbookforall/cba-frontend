export interface User {
  id: string
  email: string
  firstName: string
  lastName?: string | null
  bio?: string | null
  avatarUrl?: string | null
  role: 'admin' | 'member'
  createdAt: string
}

export interface InviteInfo {
  email: string
  firstName: string
  lastName?: string | null
}

export interface AuthResponse {
  token: string
}

export interface MessageResponse {
  message: string
}

export interface PublicProfile {
  id: string
  firstName: string
  lastName?: string | null
  bio?: string | null
  avatarUrl?: string | null
}

// Embedded user on posts/comments (subset of full User)
export interface PostUser {
  id: string
  firstName: string
  lastName?: string | null
  avatarUrl?: string | null
}

export interface Group {
  id: string
  name: string
  slug: string
  description?: string | null
  _count?: { members: number }
}

// _count shape returned by Prisma includes on post queries
export interface PostCount {
  comments: number
  reactions: number
}

export interface Post {
  id: string
  userId?: string | null
  groupId: string
  type: 'text' | 'link' | 'photo'
  title: string
  content?: string | null
  linkUrl?: string | null
  linkPreviewImage?: string | null
  linkPreviewTitle?: string | null
  linkPreviewDescription?: string | null
  mediaUrl?: string | null
  mediaUrls?: string[] | null
  isFlagged: boolean
  isPinned: boolean
  pinnedAt?: string | null
  isDownranked: boolean
  createdAt: string
  updatedAt: string
  user?: PostUser | null
  group?: Group
  // myReaction is the current user's reaction type, or null
  myReaction: 'with_you' | 'helped_me' | 'hug' | null
  // per-type reaction counts
  withYouCount: number
  helpedMeCount: number
  hugCount: number
  // flaggedByMe is true if the current user has flagged this post
  flaggedByMe: boolean
  // _count.reactions = total reactions (all types combined)
  // _count.comments = total comment count
  _count: PostCount
}

// Latest feed (cursor-based)
export interface LatestFeedResponse {
  posts: Post[]
  nextCursor: string | null
}

// Top feed (page-based)
export interface TopFeedResponse {
  pinnedPosts: Post[]
  posts: Post[]
  page: number
  hasMore: boolean
}

// Normalised shape used internally by useFeed
export interface FeedResult {
  pinnedPosts: Post[]
  posts: Post[]
  hasMore: boolean
  nextCursor: string | null // only set for latest sort
}

export type ReactionType = 'with_you' | 'helped_me' | 'hug'

export interface Comment {
  id: string
  postId: string
  userId?: string | null
  parentId?: string | null
  content: string
  isFlagged: boolean
  flaggedByMe: boolean
  createdAt: string
  updatedAt: string
  user?: PostUser | null
  replies?: Comment[]
}

export interface Notification {
  id: string
  type: 'post_comment' | 'comment_reply' | 'thread_comment'
  triggeredBy?: PostUser | null
  post: Pick<Post, 'id' | 'title'>
  comment: { id: string; content: string }
  isRead: boolean
  createdAt: string
}

export interface Flag {
  id: string
  contentType: 'post' | 'comment'
  reason?: string | null
  flaggedBy?: PostUser | null
  createdAt: string
  post?: Post
  comment?: Comment
}

// ── Admin types ───────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  firstName: string
  lastName?: string | null
  email: string
  role: 'admin' | 'member'
  isActive: boolean
  invitePending: boolean
  createdAt: string
}

export interface AdminUsersResponse {
  users: AdminUser[]
  nextCursor: string | null
}

export interface AdminGroup {
  id: string
  name: string
  slug: string
  description?: string | null
  _count: { members: number }
  suspendedCount: number
}

export interface GroupMember {
  id: string
  firstName: string
  lastName?: string | null
  email: string
  isActive: boolean
  joinedAt: string
}

export interface GroupMembersResponse {
  members: GroupMember[]
  nextCursor: string | null
}

export interface AdminFlag {
  id: string
  contentType: 'post' | 'comment'
  reason?: string | null
  flaggedBy?: { id: string; firstName: string; lastName?: string | null } | null
  post?: { id: string; title: string } | null
  comment?: { id: string; content: string; post?: { id: string; title: string } | null } | null
  createdAt: string
}

export interface AdminFlagsResponse {
  flags: AdminFlag[]
  nextCursor: string | null
}
