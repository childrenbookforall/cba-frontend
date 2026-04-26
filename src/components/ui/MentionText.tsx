import { useNavigate } from 'react-router-dom'

const MENTION_RE = /@\[([^\]]+)\]\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/g

interface MentionTextProps {
  content: string
  className?: string
}

export default function MentionText({ content, className }: MentionTextProps) {
  const navigate = useNavigate()
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  MENTION_RE.lastIndex = 0

  let match
  while ((match = MENTION_RE.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }
    const [full, displayName, userId] = match
    parts.push(
      <span
        key={match.index}
        role="link"
        tabIndex={0}
        className="text-accent font-medium cursor-pointer hover:underline"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/profile/${userId}`) }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); navigate(`/profile/${userId}`) } }}
      >
        @{displayName}
      </span>
    )
    lastIndex = match.index + full.length
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  return <span className={className}>{parts}</span>
}
