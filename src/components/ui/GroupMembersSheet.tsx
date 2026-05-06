import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomSheet from './BottomSheet'
import Avatar from './Avatar'
import Spinner from './Spinner'
import { useGroupMembers } from '../../hooks/useGroupMembers'
import type { GroupMember } from '../../types/api'

interface GroupMembersSheetProps {
  open: boolean
  onClose: () => void
  groupId: string | null
  groupName?: string
}

function MemberRow({ member, onNavigate }: { member: GroupMember; onNavigate: (id: string) => void }) {
  return (
    <button
      onClick={() => onNavigate(member.id)}
      className="w-full flex items-center gap-3 py-2.5 border-t border-border first:border-t-0 text-left cursor-pointer hover:bg-surface active:bg-surface transition-colors"
    >
      <Avatar firstName={member.firstName} lastName={member.lastName} avatarUrl={member.avatarUrl} size="md" />
      <p className="text-sm font-medium text-primary truncate">
        {member.firstName}{member.lastName ? ` ${member.lastName}` : ''}
      </p>
    </button>
  )
}

export default function GroupMembersSheet({ open, onClose, groupId, groupName }: GroupMembersSheetProps) {
  const navigate = useNavigate()
  const [searchRaw, setSearchRaw] = useState('')
  const [search, setSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const { data, isLoading, isError, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useGroupMembers(groupId, search)

  const members = data?.pages.flatMap((p) => p.members) ?? []

  useEffect(() => {
    if (!open) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setSearchRaw('')
      setSearch('')
    }
  }, [open])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && !isError) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [open, hasNextPage, isFetchingNextPage, fetchNextPage, isError])

  function handleSearchChange(value: string) {
    setSearchRaw(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(value), 300)
  }

  function handleMemberClick(id: string) {
    onClose()
    navigate(`/profile/${id}`)
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={groupName ? `${groupName} members` : 'Members'}
      titleId="group-members-title"
    >
      <div className="px-4 pb-2 pt-1">
        <input
          type="search"
          placeholder="Search members…"
          value={searchRaw}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="px-4 pb-6">
        {isLoading && !data && (
          <div className="flex justify-center py-8 text-muted">
            <Spinner />
          </div>
        )}
        {isError && !data && (
          <p className="text-xs text-muted text-center py-8">Could not load members. Please try again.</p>
        )}
        {!isLoading && !isError && members.length === 0 && (
          <p className="text-xs text-muted text-center py-8">No members found</p>
        )}
        {members.map((member) => (
          <MemberRow key={member.id} member={member} onNavigate={handleMemberClick} />
        ))}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4 text-muted">
            <Spinner size="sm" />
          </div>
        )}
        {isError && data && (
          <p className="text-xs text-muted text-center py-4">Could not load more members.</p>
        )}
        <div ref={sentinelRef} className="h-4" />
      </div>
    </BottomSheet>
  )
}
