import { useNavigate } from 'react-router-dom'

interface MentionTextProps {
  content: string
  className?: string
}

const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi

function openLink(href: string) {
  window.open(href, '_blank', 'noopener,noreferrer')
}

function linkifyUrls(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match

  while ((match = URL_RE.exec(text)) !== null) {
    let url = match[0]
    let trailing = ''
    while (url.length > 0 && /[.,!?;:'")\]}]$/.test(url)) {
      trailing = url.slice(-1) + trailing
      url = url.slice(0, -1)
    }
    if (!url) continue

    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    const href = url.startsWith('www.') ? `https://${url}` : url
    nodes.push(
      <span
        key={`${keyPrefix}-url-${match.index}`}
        role="link"
        tabIndex={0}
        className="text-accent-text underline break-all cursor-pointer hover:opacity-80"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLink(href) }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); openLink(href) } }}
      >
        {url}
      </span>
    )
    lastIndex = match.index + url.length
    if (trailing) nodes.push(trailing)
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

export default function MentionText({ content, className }: MentionTextProps) {
  const navigate = useNavigate()
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  const re = /@\[([^\]]+)\]\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/g

  let match
  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...linkifyUrls(content.slice(lastIndex, match.index), `${lastIndex}`))
    }
    const [full, displayName, userId] = match
    parts.push(
      <span
        key={match.index}
        role="link"
        tabIndex={0}
        className="text-accent-text font-medium cursor-pointer hover:underline"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/profile/${userId}`) }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); navigate(`/profile/${userId}`) } }}
      >
        @{displayName}
      </span>
    )
    lastIndex = match.index + full.length
  }

  if (lastIndex < content.length) {
    parts.push(...linkifyUrls(content.slice(lastIndex), `${lastIndex}`))
  }

  return <span className={className}>{parts}</span>
}
