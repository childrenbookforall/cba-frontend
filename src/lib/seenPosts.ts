const STORAGE_KEY = 'cba-seen-posts'

const seenSet: Set<string> = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set<string>(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
})()

export function markPostSeen(id: string): void {
  if (seenSet.has(id)) return
  seenSet.add(id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seenSet]))
  } catch { /* storage unavailable */ }
}

export function isPostSeen(id: string): boolean {
  return seenSet.has(id)
}
