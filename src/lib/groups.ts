import type { Group } from '../types/api'

// The /api/groups response nests child groups under their parents.
// Returns only the selectable leaf groups (children + standalone), never parents.
export function flattenGroups(groups: Group[] | undefined): Group[] {
  if (!groups) return []
  return groups.flatMap((g) => (g.children ? g.children : [g]))
}

// Filters a group tree by name, keeping a parent whenever it or any of its
// children match so the resulting tree stays valid input for the same renderers.
export function filterGroups(groups: Group[], query: string): Group[] {
  const q = query.trim().toLowerCase()
  if (!q) return groups
  return groups.reduce<Group[]>((acc, g) => {
    if (g.children) {
      if (g.name.toLowerCase().includes(q)) {
        acc.push(g)
      } else {
        const children = g.children.filter((c) => c.name.toLowerCase().includes(q))
        if (children.length > 0) acc.push({ ...g, children })
      }
    } else if (g.name.toLowerCase().includes(q)) {
      acc.push(g)
    }
    return acc
  }, [])
}
