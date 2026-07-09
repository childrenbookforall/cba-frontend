import type { Badge } from '../types/api'

// Highest to lowest — Host and Co-host are mutually exclusive, and the
// attendance tier (Supporter/Member/Sabbatical) is independent of that.
const BADGE_PRECEDENCE: Badge[] = ['host', 'co_host', 'supporter', 'member', 'member_sabbatical']

const BADGE_LABELS: Record<Badge, string> = {
  host: 'Host',
  co_host: 'Co-host',
  supporter: 'Supporter',
  member: 'Member',
  member_sabbatical: 'Hibernating Member',
}

const BADGE_COLOR_CLASSES: Record<Badge, string> = {
  host: 'bg-badge-host-pill text-badge-pill-fg',
  co_host: 'bg-badge-cohost-pill text-badge-pill-fg',
  supporter: 'bg-badge-supporter-pill text-badge-pill-fg',
  member: 'bg-badge-member-pill text-badge-pill-fg',
  member_sabbatical: 'bg-badge-sabbatical-pill text-badge-pill-fg',
}

const BADGE_RING_CLASSES: Record<Badge, string> = {
  host: 'ring-badge-host',
  co_host: 'ring-badge-cohost',
  supporter: 'ring-badge-supporter',
  member: 'ring-badge-member',
  member_sabbatical: 'ring-badge-sabbatical',
}

export function sortBadges(badges?: Badge[] | null): Badge[] {
  if (!badges || badges.length === 0) return []
  return BADGE_PRECEDENCE.filter((b) => badges.includes(b))
}

// The border color reflects whichever badge ranks highest.
export function getPrimaryBadge(badges?: Badge[] | null): Badge | null {
  return sortBadges(badges)[0] ?? null
}

export function getBadgeLabel(badge: Badge): string {
  return BADGE_LABELS[badge]
}

export function getBadgeColorClasses(badge: Badge): string {
  return BADGE_COLOR_CLASSES[badge]
}

export function getBadgeRingClass(badge: Badge): string {
  return BADGE_RING_CLASSES[badge]
}
