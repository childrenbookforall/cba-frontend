import { useState, useEffect } from 'react'
import { getInitials, cloudinaryUrl } from '../../lib/utils'

const AVATAR_PALETTES = [
  'bg-purple-100 text-purple-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-indigo-100 text-indigo-700',
  'bg-green-100 text-green-700',
  'bg-pink-100 text-pink-700',
  'bg-sky-100 text-sky-700',
  'bg-orange-100 text-orange-700',
  'bg-cyan-100 text-cyan-700',
]

function pickAvatarColor(firstName: string, lastName?: string | null) {
  const key = `${firstName}${lastName ?? ''}`
  const hash = [...key].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length]
}

interface AvatarProps {
  firstName: string
  lastName?: string | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-6 h-6 text-[0.5625rem]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-16 h-16 text-2xl',
}

// 2× the CSS pixel size for retina displays
const avatarTransforms: Record<string, string> = {
  sm: 'f_auto,q_auto,w_48,h_48,c_fill,g_face',
  md: 'f_auto,q_auto,w_64,h_64,c_fill,g_face',
  lg: 'f_auto,q_auto,w_128,h_128,c_fill,g_face',
}

export default function Avatar({ firstName, lastName, avatarUrl, size = 'md' }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const cls = `${sizes[size]} rounded-full flex-shrink-0 flex items-center justify-center font-bold`

  // Reset error state when the URL changes so a new upload is always attempted
  useEffect(() => {
    setImgError(false)
  }, [avatarUrl])

  if (avatarUrl && !imgError) {
    return (
      <img
        src={cloudinaryUrl(avatarUrl, avatarTransforms[size]) ?? avatarUrl}
        alt={`${firstName}${lastName ? ` ${lastName}` : ''}`}
        loading="lazy"
        onError={() => setImgError(true)}
        className={`${cls} object-cover`}
      />
    )
  }

  return (
    <div className={`${cls} ${pickAvatarColor(firstName, lastName)}`}>
      {getInitials(firstName, lastName)}
    </div>
  )
}
