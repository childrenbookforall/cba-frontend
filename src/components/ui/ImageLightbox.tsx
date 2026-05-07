import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

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
      if (e.key === 'ArrowLeft' && hasMultiple) prev()
      if (e.key === 'ArrowRight' && hasMultiple) next()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [index, hasMultiple, onClose, onChangeIndex])

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
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* View post button */}
      {postUrl && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); navigate(postUrl) }}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white text-sm bg-black/50 hover:bg-black/70 rounded-full px-3 h-9 transition z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
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
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
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
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
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
