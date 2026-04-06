import { useState, useRef } from 'react'
import { cloudinaryUrl } from '../../lib/utils'

interface MediaCarouselProps {
  urls: string[]
  alt: string
  compact?: boolean
}

export default function MediaCarousel({ urls, alt, compact = false }: MediaCarouselProps) {
  const [index, setIndex] = useState(0)
  const transforms = compact ? 'f_auto,q_auto,w_800' : 'f_auto,q_auto,w_1200'
  const maxH = compact ? 'max-h-52' : 'max-h-80'
  const touchStartX = useRef<number | null>(null)

  if (urls.length === 0) return null

  if (urls.length === 1) {
    return (
      <img
        src={cloudinaryUrl(urls[0], transforms) ?? urls[0]}
        alt={alt}
        loading="lazy"
        className={`mt-1.5 w-full rounded-lg object-contain ${maxH} bg-gray-50`}
      />
    )
  }

  function prev() {
    setIndex((i) => (i - 1 + urls.length) % urls.length)
  }

  function next() {
    setIndex((i) => (i + 1) % urls.length)
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      diff > 0 ? next() : prev()
    }
    touchStartX.current = null
  }

  return (
    <div
      className={`relative mt-1.5 w-full rounded-lg overflow-hidden bg-gray-50 ${maxH}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <img
        src={cloudinaryUrl(urls[index], transforms) ?? urls[index]}
        alt={`${alt} (${index + 1} of ${urls.length})`}
        loading="lazy"
        className={`w-full object-contain ${maxH}`}
      />

      {/* Prev button */}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); prev() }}
        aria-label="Previous photo"
        className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
      </button>

      {/* Next button */}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); next() }}
        aria-label="Next photo"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {urls.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIndex(i) }}
            aria-label={`Go to photo ${i + 1}`}
            className={`w-1.5 h-1.5 rounded-full transition ${i === index ? 'bg-white' : 'bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  )
}
