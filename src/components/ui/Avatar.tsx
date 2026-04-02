import { useState } from 'react'
import { getInitials, cloudinaryUrl } from '../../lib/utils'

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
    <div className={`${cls} bg-gray-200 text-gray-600`}>
      {getInitials(firstName, lastName)}
    </div>
  )
}
