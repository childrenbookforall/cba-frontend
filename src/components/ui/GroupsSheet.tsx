import BottomSheet from './BottomSheet'
import type { Group } from '../../types/api'

interface GroupsSheetProps {
  open: boolean
  onClose: () => void
  groups: Group[]
  activeGroupId: string | null
  onChange: (groupId: string | null) => void
}

export default function GroupsSheet({ open, onClose, groups, activeGroupId, onChange }: GroupsSheetProps) {
  function select(groupId: string | null) {
    onChange(groupId)
    onClose()
  }

  function row(id: string | null, name: string, indent = false) {
    const active = activeGroupId === id
    return (
      <button
        key={id ?? 'all'}
        onClick={() => select(id)}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-surface ${
          indent ? 'pl-8' : ''
        } ${active ? 'font-semibold text-accent-text' : 'text-gray-700 dark:text-gray-300'}`}
      >
        {name}
        {active && (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
    )
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Groups" titleId="groups-sheet-title">
      <div className="pb-4">
        {row(null, 'All Groups')}
        {groups.map((g) =>
          g.children ? (
            <div key={g.id}>
              <p className="px-4 pt-3 pb-1 text-[0.625rem] font-bold text-muted uppercase tracking-wide">
                {g.name}
              </p>
              {g.children.map((c) => row(c.id, c.name, true))}
            </div>
          ) : (
            row(g.id, g.name)
          )
        )}
      </div>
    </BottomSheet>
  )
}
