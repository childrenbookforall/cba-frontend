import { useMemo, useState } from 'react'
import { Bell, BellOff, ChevronsLeft, Search } from 'lucide-react'
import type { Group } from '../../types/api'
import { filterGroups } from '../../lib/groups'
import { useMuteGroupMutation } from '../../hooks/useMuteGroupMutation'

interface GroupsSidebarProps {
  groups: Group[]
  activeGroupId: string | null
  onChange: (groupId: string | null) => void
  onCollapse?: () => void
}

export default function GroupsSidebar({ groups, activeGroupId, onChange, onCollapse }: GroupsSidebarProps) {
  const [search, setSearch] = useState('')
  const filteredGroups = useMemo(() => filterGroups(groups, search), [groups, search])
  const muteMutation = useMuteGroupMutation()

  const itemClass = (active: boolean) =>
    `w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
      active
        ? 'bg-accent text-accent-text-fg'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
    }`

  function renderGroupRow(g: Group) {
    const active = activeGroupId === g.id
    const isRowPending = muteMutation.isPending && muteMutation.variables?.groupId === g.id
    return (
      <div
        key={g.id}
        className={`group/row w-full flex items-center gap-0.5 rounded-lg text-xs font-semibold transition ${
          active
            ? 'bg-accent text-accent-text-fg'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
        }`}
      >
        <button
          onClick={() => onChange(g.id)}
          className={`flex-1 min-w-0 text-left px-3 py-1.5 ${g.isMuted ? 'opacity-50' : ''}`}
        >
          {g.name}
        </button>
        <button
          onClick={() => muteMutation.mutate({ groupId: g.id, isMuted: !!g.isMuted })}
          disabled={isRowPending}
          aria-label={g.isMuted ? `Unmute ${g.name}` : `Mute ${g.name}`}
          title={g.isMuted ? 'Unmute group' : 'Mute group'}
          className={`p-1 mr-1.5 rounded flex-shrink-0 opacity-0 group-hover/row:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-100 disabled:cursor-wait ${
            active ? 'text-accent-text-fg' : 'text-muted hover:text-primary'
          }`}
        >
          {g.isMuted ? (
            <BellOff className="w-3.5 h-3.5" strokeWidth={2.5} />
          ) : (
            <Bell className="w-3.5 h-3.5" strokeWidth={2.5} />
          )}
        </button>
      </div>
    )
  }

  return (
    <aside className="hidden md:block w-56 flex-shrink-0 border-r border-border bg-card">
      <nav className="sticky top-[53px] max-h-[calc(100svh-53px)] overflow-y-auto p-3 flex flex-col gap-0.5">
        {onCollapse && (
          <div className="flex items-center justify-between px-3 pb-1">
            <span className="text-[0.625rem] font-bold text-muted uppercase tracking-wide">Groups</span>
            <button
              onClick={onCollapse}
              aria-label="Hide groups sidebar"
              title="Hide sidebar"
              className="p-0.5 rounded text-muted hover:text-primary transition-colors"
            >
              <ChevronsLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </div>
        )}
        <div className="px-1 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" strokeWidth={2.5} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search groups…"
              className="w-full pl-8 pr-2 py-1.5 rounded-lg text-xs bg-surface border border-border text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
        <button onClick={() => onChange(null)} className={itemClass(activeGroupId === null)}>
          All Groups
        </button>
        {filteredGroups.map((g) =>
          g.children ? (
            <div key={g.id} className="mt-3">
              <p className="px-3 mb-1 text-[0.625rem] font-bold text-muted uppercase tracking-wide">
                {g.name}
              </p>
              <div className="flex flex-col gap-0.5">
                {g.children.map((c) => renderGroupRow(c))}
              </div>
            </div>
          ) : (
            renderGroupRow(g)
          )
        )}
        {search.trim() && filteredGroups.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted">No groups found</p>
        )}
      </nav>
    </aside>
  )
}
