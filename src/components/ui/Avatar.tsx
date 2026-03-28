import { getInitials } from '../../lib/utils'

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

export default function Avatar({ firstName, lastName, avatarUrl, size = 'md' }: AvatarProps) {
  const cls = `${sizes[size]} rounded-full flex-shrink-0 flex items-center justify-center font-bold`

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${firstName}${lastName ? ` ${lastName}` : ''}`}
        loading="lazy"
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
