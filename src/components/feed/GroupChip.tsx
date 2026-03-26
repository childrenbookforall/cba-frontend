interface GroupChipProps {
  name: string
}

export default function GroupChip({ name }: GroupChipProps) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-accent text-[9px] font-semibold whitespace-nowrap">
      {name}
    </span>
  )
}
