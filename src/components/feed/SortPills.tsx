interface SortPillsProps {
  sort: 'latest' | 'top'
  onChange: (sort: 'latest' | 'top') => void
}

export default function SortPills({ sort, onChange }: SortPillsProps) {
  return (
    <div className="flex gap-1.5">
      {(['latest', 'top'] as const).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-2.5 py-1 rounded-full text-[0.625rem] font-semibold transition capitalize ${
            sort === s ? 'bg-accent text-white' : 'bg-surface text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
          }`}
        >
          {s === 'latest' ? 'New' : 'Top'}
        </button>
      ))}
    </div>
  )
}
