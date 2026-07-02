import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageLightboxProps {
  urls: string[]
  index: number
  alt: string
  onClose: () => void
  onChangeIndex: (index: number) => void
  postUrl?: string
}

export default function ImageLightbox({ urls, index, alt, onClose, onChangeIndex, postUrl }: ImageLightboxProps) {
  const navigate = useNavigate()
  const hasMultiple = urls.length > 1

  function prev() {
    onChangeIndex((index - 1 + urls.length) % urls.length)
  }

  function next() {
    onChangeIndex((index + 1) % urls.length)
  }

  useEffect(() => {
    const savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = savedOverflow }
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasMultiple) onChangeIndex((index - 1 + urls.length) % urls.length)
      if (e.key === 'ArrowRight' && hasMultiple) onChangeIndex((index + 1) % urls.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [index, urls.length, hasMultiple, onClose, onChangeIndex])

  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-black/92 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image"
        className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full w-9 h-9 flex items-center justify-center transition z-10"
      >
        <X className="w-5 h-5" strokeWidth={2.5} />
      </button>

      {/* View post button */}
      {postUrl && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); navigate(postUrl) }}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white text-sm bg-black/50 hover:bg-black/70 rounded-full px-3 h-9 transition z-10"
        >
          <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
          View post
        </button>
      )}

      {/* Image — stop propagation so clicking it doesn't close */}
      <img
        src={urls[index]}
        alt={hasMultiple ? `${alt} (${index + 1} of ${urls.length})` : alt}
        className="max-w-full max-h-full object-contain select-none"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* Prev button */}
      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); prev() }}
          aria-label="Previous photo"
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>
      )}

      {/* Next button */}
      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); next() }}
          aria-label="Next photo"
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
        </button>
      )}

      {/* Dot indicators */}
      {hasMultiple && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {urls.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); onChangeIndex(i) }}
              aria-label={`Go to photo ${i + 1}`}
              className={`w-2 h-2 rounded-full transition ${i === index ? 'bg-white' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>,
    document.body
  )
}
