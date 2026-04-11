const PALETTES = [
  'bg-blue-50 text-blue-700',
  'bg-purple-50 text-purple-700',
  'bg-green-50 text-green-700',
  'bg-amber-50 text-amber-700',
  'bg-rose-50 text-rose-700',
  'bg-teal-50 text-teal-700',
  'bg-indigo-50 text-indigo-700',
  'bg-orange-50 text-orange-700',
  'bg-cyan-50 text-cyan-700',
  'bg-pink-50 text-pink-700',
  'bg-lime-50 text-lime-700',
  'bg-sky-50 text-sky-700',
  'bg-violet-50 text-violet-700',
  'bg-emerald-50 text-emerald-700',
  'bg-fuchsia-50 text-fuchsia-700',
  'bg-red-50 text-red-700',
  'bg-yellow-50 text-yellow-700',
  'bg-stone-100 text-stone-700',
  'bg-slate-100 text-slate-700',
  'bg-zinc-100 text-zinc-700',
]

function pickColor(id: string) {
  const hash = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return PALETTES[hash % PALETTES.length]
}

interface GroupChipProps {
  id: string
  name: string
}

export default function GroupChip({ id, name }: GroupChipProps) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[0.5625rem] font-semibold whitespace-nowrap ${pickColor(id)}`}>
      {name}
    </span>
  )
}
