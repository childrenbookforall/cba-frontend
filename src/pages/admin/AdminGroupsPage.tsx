import { useState, useEffect, useRef } from 'react'
import {
  listAdminGroups,
  createAdminGroup,
  listGroupMembers,
  addGroupMember,
  removeGroupMember,
  listAdminUsers,
} from '../../api/admin'
import { getApiError } from '../../lib/utils'
import { useToast } from '../../stores/toastStore'
import Spinner from '../../components/ui/Spinner'
import type { AdminGroup, GroupMember, AdminUser } from '../../types/api'

export default function AdminGroupsPage() {
  const toast = useToast()
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [loading, setLoading] = useState(true)

  // Create group form
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', slug: '', description: '' })

  // Selected group for member management
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersNextCursor, setMembersNextCursor] = useState<string | null>(null)
  const [membersLoadingMore, setMembersLoadingMore] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')

  // All users for the member picker
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])

  // Add member form
  const [addUserId, setAddUserId] = useState('')
  const [addUserName, setAddUserName] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [adding, setAdding] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const memberSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Per-member remove loading
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  async function loadGroups() {
    try {
      const res = await listAdminGroups()
      setGroups(res)
    } catch (err) {
      toast(getApiError(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function loadMembers(groupId: string, search = '', cursor?: string) {
    if (cursor) setMembersLoadingMore(true)
    else setMembersLoading(true)
    try {
      const res = await listGroupMembers(groupId, { cursor, search: search || undefined })
      setMembers((prev) => cursor ? [...prev, ...res.members] : res.members)
      setMembersNextCursor(res.nextCursor)
    } catch (err) {
      toast(getApiError(err), 'error')
    } finally {
      setMembersLoading(false)
      setMembersLoadingMore(false)
    }
  }

  // Fetch all users (follow cursor pages) for the member picker
  async function loadAllUsers() {
    const collected: AdminUser[] = []
    let cursor: string | undefined
    let iterations = 0
    const MAX_ITERATIONS = 50
    try {
      do {
        const res = await listAdminUsers(cursor)
        collected.push(...res.users)
        cursor = res.nextCursor ?? undefined
        iterations++
      } while (cursor && iterations < MAX_ITERATIONS)
      setAllUsers(collected)
    } catch {
      // non-critical — picker just won't populate
    }
  }

  useEffect(() => { loadGroups(); loadAllUsers() }, [])

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelectGroup(groupId: string) {
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null)
      setMembers([])
      setMembersNextCursor(null)
      setMemberSearch('')
    } else {
      setSelectedGroupId(groupId)
      setAddUserId('')
      setAddUserName('')
      setUserSearch('')
      setMemberSearch('')
      setMembersNextCursor(null)
      loadMembers(groupId)
    }
  }

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setCreateForm((f) => ({ ...f, name, slug }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const group = await createAdminGroup({
        name: createForm.name,
        slug: createForm.slug,
        description: createForm.description || undefined,
      })
      setGroups((prev) => [...prev, { ...group, _count: { members: 0 }, suspendedCount: 0 }])
      setCreateForm({ name: '', slug: '', description: '' })
      setShowCreate(false)
    } catch (err) {
      toast(getApiError(err), 'error')
    } finally {
      setCreating(false)
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedGroupId || !addUserId.trim()) return
    setAdding(true)
    try {
      await addGroupMember(selectedGroupId, addUserId.trim())
      await loadMembers(selectedGroupId)
      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedGroupId
            ? { ...g, _count: { members: g._count.members + 1 } }
            : g
        )
      )
      setAddUserId('')
      setAddUserName('')
      setUserSearch('')
    } catch (err) {
      toast(getApiError(err), 'error')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!selectedGroupId) return
    setConfirmRemoveId(null)
    setRemovingId(userId)
    try {
      await removeGroupMember(selectedGroupId, userId)
      setMembers((prev) => prev.filter((m) => m.id !== userId))
      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedGroupId
            ? { ...g, _count: { members: Math.max(0, g._count.members - 1) } }
            : g
        )
      )
    } catch (err) {
      toast(getApiError(err), 'error')
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const selectedGroup = groups.find((g) => g.id === selectedGroupId)

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <title>Groups — Admin · CBA</title>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted">{groups.length} group{groups.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="text-xs font-semibold bg-primary text-white px-4 py-2 rounded-full"
        >
          {showCreate ? 'Cancel' : '+ New group'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-card border border-border rounded-xl p-4 mb-4 flex flex-col gap-3"
        >
          <p className="text-xs font-semibold text-gray-700">Create new group</p>
          <input
            required
            placeholder="Group name"
            value={createForm.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="text-xs border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
          />
          <div>
            <input
              required
              placeholder="Slug (e.g. grief-circle)"
              value={createForm.slug}
              onChange={(e) => setCreateForm((f) => ({ ...f, slug: e.target.value }))}
              pattern="[a-z0-9-]+"
              className="w-full text-xs border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
            />
            <p className="text-[10px] text-muted mt-1">Lowercase letters, numbers, and hyphens only</p>
          </div>
          <textarea
            placeholder="Description (optional)"
            value={createForm.description}
            onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="text-xs border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={creating}
            className="self-start text-xs font-semibold bg-primary text-white px-4 py-2 rounded-lg disabled:opacity-60"
          >
            {creating ? 'Creating…' : 'Create group'}
          </button>
        </form>
      )}

      {/* Groups list */}
      <div className="bg-card rounded-xl border border-border">
        {groups.length === 0 ? (
          <p className="text-center text-xs text-muted py-10">No groups yet.</p>
        ) : (
          groups.map((group, i) => (
            <div key={group.id}>
              {/* Group row */}
              <button
                onClick={() => handleSelectGroup(group.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-surface ${
                  i < groups.length - 1 && selectedGroupId !== group.id
                    ? 'border-b border-border'
                    : ''
                } ${selectedGroupId === group.id ? 'bg-blue-50' : ''} ${
                  i === 0 ? 'rounded-t-xl' : ''
                } ${i === groups.length - 1 && selectedGroupId !== group.id ? 'rounded-b-xl' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900">{group.name}</p>
                  {group.description && (
                    <p className="text-[10px] text-muted truncate">{group.description}</p>
                  )}
                  <p className="text-[10px] text-muted">/{group.slug}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted">
                    {group._count.members} member{group._count.members !== 1 ? 's' : ''}
                  </span>
                  {group.suspendedCount > 0 && (
                    <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                      {group.suspendedCount} suspended
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {selectedGroupId === group.id ? '▲' : '▼'}
                </span>
              </button>

              {/* Members panel */}
              {selectedGroupId === group.id && (
                <div className={`bg-surface border-t border-border px-4 py-4 ${i === groups.length - 1 ? 'rounded-b-xl' : ''}`}>
                  <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-3">
                    Members of {selectedGroup?.name}
                  </p>

                  {/* Add member form */}
                  <form onSubmit={handleAddMember} className="flex gap-2 items-end">
                    <div className="flex-1" ref={pickerRef}>
                      <label className="text-[10px] font-semibold text-muted uppercase tracking-wide block mb-1">
                        Add member
                      </label>
                      <div className="relative">
                        {addUserId ? (
                          // Confirmed selection — show chip with clear button
                          <div className="flex items-center gap-2 border border-primary rounded-lg px-3 py-2 bg-card">
                            <span className="text-xs text-gray-900 flex-1">{addUserName}</span>
                            <button
                              type="button"
                              onClick={() => { setAddUserId(''); setAddUserName(''); setUserSearch('') }}
                              className="text-muted hover:text-gray-700 text-xs"
                              aria-label="Clear selection"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Search by name or email…"
                            value={userSearch}
                            onChange={(e) => { setUserSearch(e.target.value); setShowSuggestions(true) }}
                            onFocus={() => setShowSuggestions(true)}
                            className="w-full text-xs border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-card"
                          />
                        )}
                        {showSuggestions && !addUserId && userSearch.trim() && (() => {
                          const q = userSearch.toLowerCase()
                          const currentMemberIds = new Set(members.map((m) => m.id))
                          const suggestions = allUsers.filter((u) =>
                            !currentMemberIds.has(u.id) && (
                              u.firstName.toLowerCase().includes(q) ||
                              u.lastName.toLowerCase().includes(q) ||
                              u.email.toLowerCase().includes(q)
                            )
                          ).slice(0, 6)
                          return suggestions.length > 0 ? (
                            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-md overflow-hidden">
                              {suggestions.map((u) => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    setAddUserId(u.id)
                                    setAddUserName(`${u.firstName} ${u.lastName}`)
                                    setShowSuggestions(false)
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-surface transition"
                                >
                                  <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                    {u.firstName[0]}{u.lastName[0]}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate">{u.firstName} {u.lastName}</p>
                                    <p className="text-[10px] text-muted truncate">{u.email}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-md px-3 py-2">
                              <p className="text-xs text-muted">No members found</p>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={adding || !addUserId.trim()}
                      className="text-xs font-semibold bg-accent text-white px-3 py-2 rounded-lg disabled:opacity-50 flex-shrink-0"
                    >
                      {adding ? <Spinner size="sm" /> : 'Add'}
                    </button>
                  </form>

                  {/* Members list */}
                  <div className="mt-4">
                    <input
                      type="search"
                      placeholder="Search members…"
                      value={memberSearch}
                      onChange={(e) => {
                        const q = e.target.value
                        setMemberSearch(q)
                        if (memberSearchTimer.current) clearTimeout(memberSearchTimer.current)
                        memberSearchTimer.current = setTimeout(() => {
                          setMembersNextCursor(null)
                          loadMembers(group.id, q)
                        }, 300)
                      }}
                      className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-card focus:outline-none focus:border-primary mb-3"
                    />
                    {membersLoading ? (
                      <div className="flex justify-center py-4">
                        <Spinner />
                      </div>
                    ) : members.length === 0 ? (
                      <p className="text-xs text-muted py-2">
                        {memberSearch ? 'No members match your search.' : 'No members yet.'}
                      </p>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          {members.map((m) => (
                            <div
                              key={m.id}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${
                                m.isActive
                                  ? 'bg-card border-border'
                                  : 'bg-red-50 border-red-200'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium ${m.isActive ? 'text-gray-800' : 'text-red-800'}`}>
                                  {m.firstName} {m.lastName}
                                  {!m.isActive && (
                                    <span className="ml-1.5 text-[9px] bg-red-200 text-red-700 font-bold uppercase px-1 rounded">
                                      Suspended
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] text-muted">{m.email}</p>
                              </div>
                              {confirmRemoveId === m.id ? (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <span className="text-[10px] text-danger font-medium">Sure?</span>
                                  <button
                                    onClick={() => handleRemoveMember(m.id)}
                                    className="text-[10px] font-semibold text-white bg-danger px-2 py-1 rounded-lg"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setConfirmRemoveId(null)}
                                    className="text-[10px] font-semibold text-muted border border-border px-2 py-1 rounded-lg"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmRemoveId(m.id)}
                                  disabled={removingId === m.id}
                                  className="text-[10px] font-semibold text-danger border border-danger px-2 py-1 rounded-lg disabled:opacity-40 hover:bg-red-50 transition flex-shrink-0"
                                >
                                  {removingId === m.id ? <Spinner size="sm" /> : 'Remove'}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        {membersNextCursor && (
                          <button
                            onClick={() => loadMembers(group.id, memberSearch, membersNextCursor)}
                            disabled={membersLoadingMore}
                            className="mt-3 w-full py-2 rounded-lg border border-border text-xs font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                          >
                            {membersLoadingMore ? <Spinner size="sm" /> : 'Load more members'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
