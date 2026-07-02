import { useMemo, useState } from 'react'
import { Bell, BellOff, Check, Search } from 'lucide-react'
import BottomSheet from './BottomSheet'
import type { Group } from '../../types/api'
import { filterGroups } from '../../lib/groups'
import { useMuteGroupMutation } from '../../hooks/useMuteGroupMutation'

interface GroupsSheetProps {
  open: boolean
  onClose: () => void
  groups: Group[]
  activeGroupId: string | null
  onChange: (groupId: string | null) => void
}

export default function GroupsSheet({ open, onClose, groups, activeGroupId, onChange }: GroupsSheetProps) {
  const [search, setSearch] = useState('')
  const [prevOpen, setPrevOpen] = useState(open)
  const muteMutation = useMuteGroupMutation()

  if (prevOpen !== open) {
    setPrevOpen(open)
    if (!open) setSearch('')
  }

  const filteredGroups = useMemo(() => filterGroups(groups, search), [groups, search])

  function select(groupId: string | null) {
    onChange(groupId)
    onClose()
  }

  function row(group: Group | null, name: string, indent = false) {
    const id = group?.id ?? null
    const active = activeGroupId === id
    return (
      <div key={id ?? 'all'} className="flex items-center transition hover:bg-surface">
        <button
          onClick={() => select(id)}
          className={`flex-1 min-w-0 flex items-center justify-between px-4 py-2.5 text-left text-sm ${
            indent ? 'pl-8' : ''
          } ${active ? 'font-semibold text-accent-text' : 'text-gray-700 dark:text-gray-300'} ${
            group?.isMuted ? 'opacity-50' : ''
          }`}
        >
          <span className="truncate">{name}</span>
          {active && (
            <Check className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
          )}
        </button>
        {group && (
          <button
            onClick={() => muteMutation.mutate({ groupId: group.id, isMuted: !!group.isMuted })}
            disabled={muteMutation.isPending && muteMutation.variables?.groupId === group.id}
            aria-label={group.isMuted ? `Unmute ${group.name}` : `Mute ${group.name}`}
            className="p-2.5 mr-1 rounded text-muted hover:text-primary flex-shrink-0 disabled:cursor-wait"
          >
            {group.isMuted ? (
              <BellOff className="w-4 h-4" strokeWidth={2.5} />
            ) : (
              <Bell className="w-4 h-4" strokeWidth={2.5} />
            )}
          </button>
        )}
      </div>
    )
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Groups" titleId="groups-sheet-title">
      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" strokeWidth={2.5} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-surface border border-border text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>
      <div className="pb-4">
        {row(null, 'All Groups')}
        {filteredGroups.map((g) =>
          g.children ? (
            <div key={g.id}>
              <p className="px-4 pt-3 pb-1 text-[0.625rem] font-bold text-muted uppercase tracking-wide">
                {g.name}
              </p>
              {g.children.map((c) => row(c, c.name, true))}
            </div>
          ) : (
            row(g, g.name)
          )
        )}
        {search.trim() && filteredGroups.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted text-center">No groups found</p>
        )}
      </div>
    </BottomSheet>
  )
}
