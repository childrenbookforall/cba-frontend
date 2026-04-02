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
  return new Date(dateStr).toLocaleDateString()
}

export function getApiError(err: unknown): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
  ) {
    return (err as { response: { data: { error: string } } }).response.data.error
  }
  return 'Something went wrong. Please try again.'
}
