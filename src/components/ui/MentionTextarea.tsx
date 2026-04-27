import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchUsers } from '../../api/users'
import Avatar from './Avatar'
import type { PostUser } from '../../types/api'
// @ts-expect-error - no types for textarea-caret
import getCaretCoordinates from 'textarea-caret'

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

const MENTION_STORAGE_RE = /@\[([^\]]+)\]\(([^)]+)\)/g

function toDisplay(storageValue: string): string {
  return storageValue.replace(MENTION_STORAGE_RE, '@$1')
}

function extractMentions(storageValue: string): Record<string, string> {
  const map: Record<string, string> = {}
  let m: RegExpExecArray | null
  const re = new RegExp(MENTION_STORAGE_RE.source, 'g')
  while ((m = re.exec(storageValue)) !== null) {
    map[m[1]] = m[2]
  }
  return map
}

function toStorage(displayValue: string, mentionedUsers: Record<string, string>): string {
  const names = Object.keys(mentionedUsers)
  if (names.length === 0) return displayValue
  // Longest names first so "John Doe" is matched before "John"
  names.sort((a, b) => b.length - a.length)
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  // (?!\w) prevents @John matching inside @Johnny
  const re = new RegExp('@(' + escaped.join('|') + ')(?!\\w)', 'g')
  return displayValue.replace(re, (_, name: string) => `@[${name}](${mentionedUsers[name]})`)
}

export interface MentionTextareaHandle {
  insertText(text: string): void
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
}

const MentionTextarea = forwardRef<MentionTextareaHandle, MentionTextareaProps>(function MentionTextarea({
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
}, ref) {
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

  const [displayValue, setDisplayValue] = useState(() => toDisplay(value))
  const mentionedUsersRef = useRef<Record<string, string>>(extractMentions(value))
  const lastStorageRef = useRef(value)

  useEffect(() => {
    if (value !== lastStorageRef.current) {
      lastStorageRef.current = value
      setDisplayValue(toDisplay(value))
      mentionedUsersRef.current = extractMentions(value)
    }
  }, [value])

  useImperativeHandle(ref, () => ({
    insertText(text: string) {
      const el = internalRef.current
      if (!el) return
      const start = el.selectionStart ?? displayValue.length
      const end = el.selectionEnd ?? displayValue.length
      const newDisplay = displayValue.slice(0, start) + text + displayValue.slice(end)
      setDisplayValue(newDisplay)
      const newStorage = toStorage(newDisplay, mentionedUsersRef.current)
      lastStorageRef.current = newStorage
      onChange(newStorage)
      const newCursor = start + text.length
      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(newCursor, newCursor)
      })
    },
  }), [displayValue, onChange])

  const [mention, setMention] = useState<MentionState | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [debouncedQuery, setDebouncedQuery] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; above: boolean } | null>(null)

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
    setDropdownPos(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }

  function computeDropdownPos(atIndex: number) {
    const el = internalRef.current
    if (!el) return
    const caret = getCaretCoordinates(el, atIndex)
    const ta = el.getBoundingClientRect()
    const wrapper = el.parentElement!.getBoundingClientRect()
    // caret.top/left are relative to the textarea's top-left, accounting for scroll
    const relTop = ta.top - wrapper.top + caret.top - el.scrollTop
    const relLeft = ta.left - wrapper.left + caret.left
    const lineHeight = caret.height ?? 20
    const dropdownHeight = 200 // rough max height of the list
    const spaceBelow = window.innerHeight - (ta.top + caret.top - el.scrollTop + lineHeight)
    const above = spaceBelow < dropdownHeight
    setDropdownPos({ top: relTop + (above ? 0 : lineHeight), left: relLeft, above })
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newDisplay = e.target.value
    setDisplayValue(newDisplay)
    const newStorage = toStorage(newDisplay, mentionedUsersRef.current)
    lastStorageRef.current = newStorage
    onChange(newStorage)

    const cursor = e.target.selectionStart ?? newDisplay.length
    const active = getActiveMention(newDisplay, cursor)

    if (active) {
      setMention(active)
      setSelectedIndex(0)
      computeDropdownPos(active.start)
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
    const cursorPos = el.selectionStart ?? displayValue.length
    const displayName = `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    const mentionText = `@${displayName}`
    const newDisplay = displayValue.slice(0, mention.start) + mentionText + ' ' + displayValue.slice(cursorPos)
    mentionedUsersRef.current[displayName] = user.id
    setDisplayValue(newDisplay)
    const newStorage = toStorage(newDisplay, mentionedUsersRef.current)
    lastStorageRef.current = newStorage
    onChange(newStorage)
    closeMention()
    const newCursor = mention.start + mentionText.length + 1
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

  return (
    <div className={`relative ${wrapperClassName}`}>
      <textarea
        ref={setRef}
        value={displayValue}
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

      {isOpen && dropdownPos && (
        <div
          className="absolute w-64 max-w-full bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
          style={
            dropdownPos.above
              ? { bottom: `calc(100% - ${dropdownPos.top}px + 4px)`, left: dropdownPos.left }
              : { top: dropdownPos.top + 4, left: dropdownPos.left }
          }
        >
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
})

export default MentionTextarea
