import { useRef, useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchUsers } from '../../api/users'
import Avatar from './Avatar'
import type { PostUser } from '../../types/api'

interface MentionState {
  query: string
  start: number
}

function getActiveMention(value: string, cursor: number): MentionState | null {
  const before = value.slice(0, cursor)
  const match = before.match(/@([^\s@]*)$/)
  if (!match) return null
  return { query: match[1], start: match.index! }
}

interface MentionTextareaProps {
  value: string
  onChange: (value: string) => void
  groupId?: string
  placeholder?: string
  rows?: number
  className?: string
  wrapperClassName?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onFocus?: () => void
  onBlur?: () => void
  onInput?: (e: React.FormEvent<HTMLTextAreaElement>) => void
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>
  autoFocus?: boolean
  disabled?: boolean
  dropdownPlacement?: 'above' | 'below'
}

export default function MentionTextarea({
  value,
  onChange,
  groupId,
  placeholder,
  rows = 1,
  className = '',
  wrapperClassName = '',
  onKeyDown,
  onFocus,
  onBlur,
  onInput,
  textareaRef: externalRef,
  autoFocus,
  disabled,
  dropdownPlacement = 'above',
}: MentionTextareaProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null)

  const setRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      (internalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node
      if (externalRef) {
        (externalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node
      }
    },
    [externalRef],
  )

  const [mention, setMention] = useState<MentionState | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [debouncedQuery, setDebouncedQuery] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: searchResults = [] } = useQuery({
    queryKey: ['user-search', debouncedQuery, groupId ?? '__all'],
    queryFn: () => searchUsers(debouncedQuery!, groupId),
    enabled: debouncedQuery !== null && debouncedQuery.length >= 1,
    staleTime: 30_000,
  })

  const isOpen = mention !== null && searchResults.length > 0

  function closeMention() {
    setMention(null)
    setDebouncedQuery(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value
    onChange(newValue)

    const cursor = e.target.selectionStart ?? newValue.length
    const active = getActiveMention(newValue, cursor)

    if (active) {
      setMention(active)
      setSelectedIndex(0)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => setDebouncedQuery(active.query), 200)
    } else {
      closeMention()
    }
  }

  function handleSelect() {
    const el = internalRef.current
    if (!el || !mention) return
    const cursor = el.selectionStart ?? el.value.length
    const active = getActiveMention(el.value, cursor)
    if (!active || active.start !== mention.start) closeMention()
  }

  function insertMention(user: PostUser) {
    const el = internalRef.current
    if (!mention || !el) return
    const cursorPos = el.selectionStart ?? value.length
    const displayName = `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    const token = `@[${displayName}](${user.id})`
    const newValue = value.slice(0, mention.start) + token + ' ' + value.slice(cursorPos)
    onChange(newValue)
    closeMention()
    const newCursor = mention.start + token.length + 1
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(newCursor, newCursor)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (isOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, searchResults.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        const user = searchResults[selectedIndex] ?? searchResults[0]
        if (user) insertMention(user)
        return
      }
      if (e.key === 'Escape') {
        closeMention()
        return
      }
    }
    onKeyDown?.(e)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const dropdownClasses =
    dropdownPlacement === 'above'
      ? 'absolute bottom-full left-0 mb-1'
      : 'absolute top-full left-0 mt-1'

  return (
    <div className={`relative ${wrapperClassName}`}>
      <textarea
        ref={setRef}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        onInput={onInput}
        placeholder={placeholder}
        rows={rows}
        className={className}
        autoFocus={autoFocus}
        disabled={disabled}
      />

      {isOpen && (
        <div className={`${dropdownClasses} w-64 max-w-full bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden`}>
          {searchResults.map((user, i) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                insertMention(user)
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition ${
                i === selectedIndex ? 'bg-surface' : 'hover:bg-surface'
              }`}
            >
              <Avatar
                firstName={user.firstName}
                lastName={user.lastName}
                avatarUrl={user.avatarUrl}
                size="sm"
              />
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                {user.firstName}{user.lastName ? ` ${user.lastName}` : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
