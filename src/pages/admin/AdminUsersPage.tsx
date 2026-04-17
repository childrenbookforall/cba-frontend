import { useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import {
  listAdminUsers,
  createAdminUser,
  sendInvite,
  suspendUser,
  deleteAdminUser,
} from '../../api/admin'
import { getApiError } from '../../lib/utils'
import { useToast } from '../../stores/toastStore'
import Spinner from '../../components/ui/Spinner'

export default function AdminUsersPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', email: '' })

  // Per-row action loading
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({})
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['admin-users'],
    queryFn: ({ pageParam }) => listAdminUsers(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  })

  const users = data?.pages.flatMap((p) => p.users) ?? []

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      await createAdminUser(createForm)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setCreateForm({ firstName: '', lastName: '', email: '' })
      setShowCreate(false)
    } catch (err) {
      toast(getApiError(err), 'error')
    } finally {
      setCreating(false)
    }
  }

  async function handleInvite(userId: string) {
    setActionLoading((a) => ({ ...a, [userId]: 'invite' }))
    try {
      await sendInvite(userId)
      toast('Invite sent successfully')
    } catch (err) {
      toast(getApiError(err), 'error')
    } finally {
      setActionLoading((a) => { const n = { ...a }; delete n[userId]; return n })
    }
  }

  async function handleSuspend(userId: string) {
    setActionLoading((a) => ({ ...a, [userId]: 'suspend' }))
    try {
      await suspendUser(userId)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    } catch (err) {
      toast(getApiError(err), 'error')
    } finally {
      setActionLoading((a) => { const n = { ...a }; delete n[userId]; return n })
    }
  }

  async function handleDelete(userId: string) {
    setConfirmDeleteId(null)
    setActionLoading((a) => ({ ...a, [userId]: 'delete' }))
    try {
      await deleteAdminUser(userId)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    } catch (err) {
      toast(getApiError(err), 'error')
    } finally {
      setActionLoading((a) => { const n = { ...a }; delete n[userId]; return n })
    }
  }

  const filtered = search.trim()
    ? users.filter((u) => {
        const q = search.toLowerCase()
        return (
          u.firstName.toLowerCase().includes(q) ||
          u.lastName?.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        )
      })
    : users

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <title>Users - Admin · CBA</title>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-xs border border-border rounded-full px-4 py-2 bg-card focus:outline-none focus:border-accent"
        />
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="text-xs font-semibold bg-primary text-white dark:text-surface px-4 py-2 rounded-full whitespace-nowrap"
        >
          {showCreate ? 'Cancel' : '+ New member'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-card border border-border rounded-xl p-4 mb-4 flex flex-col gap-3"
        >
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Create new member</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="First name"
              value={createForm.firstName}
              onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
              className="text-xs border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
            />
            <input
              placeholder="Last name (optional)"
              value={createForm.lastName}
              onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
              className="text-xs border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
            />
          </div>
          <input
            required
            type="email"
            placeholder="Email address"
            value={createForm.email}
            onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            className="text-xs border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="text-xs font-semibold bg-primary text-white dark:text-surface px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create member'}
            </button>
            <p className="text-[0.625rem] text-muted self-center">
              You can send the invite email from the member row after creating.
            </p>
          </div>
        </form>
      )}

      {/* Count */}
      <p className="text-[0.625rem] text-muted mb-2">
        {filtered.length} member{filtered.length !== 1 ? 's' : ''} shown
        {search && ' (filtered)'}
      </p>

      {/* User list */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-muted py-10">No members found.</p>
        ) : (
          filtered.map((user, i) => {
            const busy = actionLoading[user.id]
            return (
              <div
                key={user.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < filtered.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                {/* Initials avatar */}
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {user.firstName[0]}{user.lastName?.[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {user.firstName} {user.lastName}
                    </span>
                    {user.role === 'admin' && (
                      <span className="text-[0.5625rem] font-bold uppercase bg-primary text-white dark:text-surface px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                    {user.invitePending ? (
                      <span className="text-[0.5625rem] font-bold uppercase px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                        Pending
                      </span>
                    ) : (
                      <span
                        className={`text-[0.5625rem] font-bold uppercase px-1.5 py-0.5 rounded ${
                          user.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    )}
                  </div>
                  <p className="text-[0.625rem] text-muted truncate">{user.email}</p>
                  <p className="text-[0.625rem] text-gray-300 dark:text-gray-600 font-mono truncate select-all" title="User ID - copy this to add as group member">
                    {user.id}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleInvite(user.id)}
                    disabled={!!busy}
                    title="Send invite email"
                    className="text-[0.625rem] font-semibold text-accent border border-accent px-2 py-1 rounded-lg disabled:opacity-40 hover:bg-blue-50 dark:hover:bg-blue-950 transition"
                  >
                    {busy === 'invite' ? <Spinner size="sm" /> : 'Invite'}
                  </button>
                  <button
                    onClick={() => handleSuspend(user.id)}
                    disabled={!!busy}
                    title={user.isActive ? 'Suspend member' : 'Reactivate member'}
                    className="text-[0.625rem] font-semibold text-gray-600 dark:text-gray-400 border border-border px-2 py-1 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition"
                  >
                    {busy === 'suspend' ? <Spinner size="sm" /> : user.isActive ? 'Suspend' : 'Reactivate'}
                  </button>
                  {confirmDeleteId === user.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[0.625rem] text-danger font-medium">Sure?</span>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-[0.625rem] font-semibold text-white bg-danger px-2 py-1 rounded-lg"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[0.625rem] font-semibold text-muted border border-border px-2 py-1 rounded-lg"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(user.id)}
                      disabled={!!busy}
                      title="Delete member"
                      className="text-[0.625rem] font-semibold text-danger border border-danger px-2 py-1 rounded-lg disabled:opacity-40 hover:bg-red-50 dark:hover:bg-red-950 transition"
                    >
                      {busy === 'delete' ? <Spinner size="sm" /> : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* More */}
      {hasNextPage && !search && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-6 py-2 rounded-full bg-surface border border-border text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition"
          >
            {isFetchingNextPage ? <Spinner size="sm" /> : 'More'}
          </button>
        </div>
      )}
    </div>
  )
}
