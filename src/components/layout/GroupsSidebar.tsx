import type { Group } from '../../types/api'

interface GroupsSidebarProps {
  groups: Group[]
  activeGroupId: string | null
  onChange: (groupId: string | null) => void
}

export default function GroupsSidebar({ groups, activeGroupId, onChange }: GroupsSidebarProps) {
  const itemClass = (active: boolean) =>
    `w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
      active
        ? 'bg-accent text-accent-text-fg'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
    }`

  return (
    <aside className="hidden md:block w-56 flex-shrink-0 border-r border-border bg-card">
      <nav className="sticky top-[53px] max-h-[calc(100svh-53px)] overflow-y-auto p-3 flex flex-col gap-0.5">
        <button onClick={() => onChange(null)} className={itemClass(activeGroupId === null)}>
          All Groups
        </button>
        {groups.map((g) =>
          g.children ? (
            <div key={g.id} className="mt-3">
              <p className="px-3 mb-1 text-[0.625rem] font-bold text-muted uppercase tracking-wide">
                {g.name}
              </p>
              <div className="flex flex-col gap-0.5">
                {g.children.map((c) => (
                  <button key={c.id} onClick={() => onChange(c.id)} className={itemClass(activeGroupId === c.id)}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button key={g.id} onClick={() => onChange(g.id)} className={itemClass(activeGroupId === g.id)}>
              {g.name}
            </button>
          )
        )}
      </nav>
    </aside>
  )
}
