import { useState } from 'react'

interface LinkPreviewProps {
  url: string
  previewImage?: string | null
  previewTitle?: string | null
  previewDescription?: string | null
}

export default function LinkPreview({ url, previewImage, previewTitle, previewDescription }: LinkPreviewProps) {
  const [imgError, setImgError] = useState(false)

  let safeUrl: string | null = null
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') safeUrl = url
  } catch { /* invalid URL */ }

  if (!safeUrl) return null

  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const showImage = !!previewImage && !imgError

  const openLink = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.open(safeUrl!, '_blank', 'noopener,noreferrer')
  }

  if (!showImage && !previewTitle) {
    return (
      <div
        role="link"
        tabIndex={0}
        onClick={openLink}
        onKeyDown={(e) => { if (e.key === 'Enter') openLink(e) }}
        className="mt-1.5 flex items-center gap-2 bg-surface rounded-lg px-2.5 py-2 border border-border hover:border-accent transition cursor-pointer"
      >
        <span className="text-base">🔗</span>
        <span className="text-xs text-accent-text font-medium truncate">{displayUrl}</span>
      </div>
    )
  }

  return (
    <div className="mt-1.5 flex justify-center">
      <div
        role="link"
        tabIndex={0}
        onClick={openLink}
        onKeyDown={(e) => { if (e.key === 'Enter') openLink(e) }}
        className="w-56 border border-border rounded-xl hover:border-accent transition bg-surface text-center cursor-pointer"
      >
        {showImage && (
          <img
            src={previewImage!}
            alt={previewTitle ?? displayUrl}
            onError={() => setImgError(true)}
            className="w-full rounded-t-xl"
          />
        )}
        <div className="px-3 py-2">
          {previewTitle && (
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{previewTitle}</p>
          )}
          {previewDescription && (
            <p className="text-[0.625rem] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{previewDescription}</p>
          )}
          <p className="text-[0.625rem] text-muted mt-0.5 truncate">🔗 {displayUrl}</p>
        </div>
      </div>
    </div>
  )
}
