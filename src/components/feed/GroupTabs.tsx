import type { Group } from '../../types/api'

interface GroupTabsProps {
  groups: Group[]
  activeGroupId: string | null
  onChange: (groupId: string | null) => void
}

export default function GroupTabs({ groups, activeGroupId, onChange }: GroupTabsProps) {
  return (
    <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto bg-card border-b border-border scrollbar-none">
      <button
        onClick={() => onChange(null)}
        className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold transition ${
          activeGroupId === null
            ? 'bg-accent text-white'
            : 'bg-surface text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
        }`}
      >
        All Groups
      </button>
      {groups.map((g) => (
        <button
          key={g.id}
          onClick={() => onChange(g.id)}
          className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold transition ${
            activeGroupId === g.id
              ? 'bg-accent text-white'
              : 'bg-surface text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
          }`}
        >
          {g.name}
        </button>
      ))}
    </div>
  )
}
