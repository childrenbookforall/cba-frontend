import type { Group } from '../types/api'

// The /api/groups response nests child groups under their parents.
// Returns only the selectable leaf groups (children + standalone), never parents.
export function flattenGroups(groups: Group[] | undefined): Group[] {
  if (!groups) return []
  return groups.flatMap((g) => (g.children ? g.children : [g]))
}
