// Inject Cloudinary URL transformations after /upload/.
// Falls back to the original URL for non-Cloudinary or already-transformed URLs.
export function cloudinaryUrl(
  url: string | null | undefined,
  transforms: string
): string | undefined {
  if (!url) return undefined
  const marker = '/upload/'
  const idx = url.indexOf(marker)
  if (idx === -1) return url
  // Don't double-inject if transforms are already present
  const afterUpload = url.slice(idx + marker.length)
  if (afterUpload.startsWith(transforms)) return url
  return url.slice(0, idx + marker.length) + transforms + '/' + afterUpload
}

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function getInitials(firstName: string, lastName?: string | null) {
  return `${firstName[0]}${lastName ? lastName[0] : ''}`.toUpperCase()
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (days < 30) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (days < 365) return `${months}mo ago`
  const years = Math.floor(days / 365)
  return `${years}y ago`
}

export function getApiError(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as { response?: { status?: number; data?: { error?: string } }; request?: unknown }
    if (e.response) {
      if (typeof e.response.data?.error === 'string') return e.response.data.error
      if (e.response.status === 429) return 'Too many requests. Please try again later.'
      if (e.response.status && e.response.status >= 500) return 'Server error. Please try again.'
    } else if (e.request) {
      return 'Network error. Please check your connection.'
    }
  }
  return 'Something went wrong. Please try again.'
}
