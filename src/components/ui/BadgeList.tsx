import { sortBadges, getBadgeLabel, getBadgeColorClasses } from '../../lib/badges'
import type { Badge } from '../../types/api'

interface BadgeListProps {
  badges?: Badge[]
  className?: string
}

export default function BadgeList({ badges, className = '' }: BadgeListProps) {
  const sorted = sortBadges(badges)
  if (sorted.length === 0) return null

  return (
    <div className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}>
      {sorted.map((badge) => (
        <span
          key={badge}
          className={`inline-block text-[0.625rem] font-semibold px-2 py-0.5 rounded-full ${getBadgeColorClasses(badge)}`}
        >
          {getBadgeLabel(badge)}
        </span>
      ))}
    </div>
  )
}
