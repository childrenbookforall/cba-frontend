import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { updateMe, uploadAvatar } from '../api/users'
import { logoutApi } from '../api/auth'
import { getApiError } from '../lib/utils'
import { useToast } from '../stores/toastStore'
import Avatar from '../components/ui/Avatar'
import Spinner from '../components/ui/Spinner'
import BottomNav from '../components/layout/BottomNav'
import NavLinks from '../components/layout/NavLinks'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, token, setAuth, clearAuth } = useAuthStore()
  const toast = useToast()
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const [bioValue, setBioValue] = useState(user?.bio ?? '')

  const bioMutation = useMutation({
    mutationFn: () => updateMe({ bio: bioValue }),
    onSuccess: (updatedUser) => {
      setAuth(token!, { ...user!, ...updatedUser })
      setEditingBio(false)
      toast('Profile updated')
    },
    onError: (err) => toast(getApiError(err), 'error'),
  })

  const avatarMutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (updatedUser) => {
      setAuth(token!, { ...user!, ...updatedUser })
      toast('Photo updated')
    },
    onError: (err) => toast(getApiError(err), 'error'),
  })

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) avatarMutation.mutate(accepted[0])
    },
    [avatarMutation]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    disabled: avatarMutation.isPending,
  })

  if (!user) return null

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-svh bg-surface flex flex-col pb-20 sm:pb-0">
      <title>Profile — CBA</title>
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-700 transition"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h1 className="text-sm font-bold text-gray-900 flex-1">Profile</h1>
        <NavLinks />
      </div>

      {/* Profile card */}
      <div className="bg-card mt-2 px-4 pt-6 pb-5">
        {/* Avatar with upload overlay */}
        <div className="flex flex-col items-center mb-5">
          <div
            {...getRootProps()}
            role="button"
            aria-label="Change profile photo"
            className={`relative cursor-pointer rounded-full transition ${isDragActive ? 'ring-2 ring-accent' : ''}`}
            title="Tap to change photo"
          >
            <input {...getInputProps()} />
            <Avatar
              firstName={user.firstName}
              lastName={user.lastName}
              avatarUrl={user.avatarUrl}
              size="lg"
            />
            {/* Camera overlay */}
            <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition">
              <span className="text-white text-lg">📷</span>
            </div>
            {/* Uploading spinner */}
            {avatarMutation.isPending && (
              <div className="absolute inset-0 rounded-full bg-white/70 flex items-center justify-center">
                <Spinner size="sm" />
              </div>
            )}
          </div>
          <p className="text-[0.625rem] text-muted mt-2">Tap photo to change</p>
        </div>

        {/* Name + role */}
        <div className="text-center mb-4">
          <h2 className="text-base font-bold text-gray-900">
            {user.firstName} {user.lastName}
          </h2>
          {user.role === 'admin' && (
            <span className="inline-block mt-1 text-[0.625rem] font-semibold uppercase tracking-wide bg-primary text-white px-2 py-0.5 rounded-full">
              Admin
            </span>
          )}
          <p className="text-[0.625rem] text-muted mt-1">Member since {memberSince}</p>
        </div>

        {/* Email */}
        <div className="border-t border-border pt-4">
          <p className="text-[0.625rem] font-semibold text-muted uppercase tracking-wide mb-1">Email</p>
          <p className="text-xs text-gray-700">{user.email}</p>
        </div>
      </div>

      {/* Bio section */}
      <div className="bg-card mt-2 px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[0.625rem] font-semibold text-muted uppercase tracking-wide">About me</p>
          {!editingBio && (
            <button
              onClick={() => { setBioValue(user.bio ?? ''); setEditingBio(true) }}
              className="text-[0.625rem] text-accent font-medium"
            >
              Edit
            </button>
          )}
        </div>

        {editingBio ? (
          <div>
            <textarea
              autoFocus
              value={bioValue}
              onChange={(e) => setBioValue(e.target.value)}
              rows={4}
              placeholder="Tell the community a little about yourself…"
              className="w-full text-xs border border-border rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-primary bg-surface"
            />
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={() => bioMutation.mutate()}
                disabled={bioMutation.isPending}
                className="text-[0.625rem] font-semibold text-white bg-primary px-4 py-1.5 rounded-lg disabled:opacity-60"
              >
                {bioMutation.isPending ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setEditingBio(false)}
                className="text-[0.625rem] font-semibold text-muted px-3 py-1.5 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-600 leading-relaxed">
            {user.bio || <span className="text-muted italic">No bio yet.</span>}
          </p>
        )}
      </div>

      {/* Sign out */}
      <div className="px-4 py-4 flex justify-center">
        {confirmSignOut ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600">Sign out?</span>
            <button
              onClick={async () => { try { await logoutApi() } finally { clearAuth(); navigate('/login', { replace: true }) } }}
              className="text-xs font-semibold text-danger hover:underline transition"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmSignOut(false)}
              className="text-xs text-muted hover:text-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmSignOut(true)}
            className="text-xs text-muted hover:text-danger transition"
          >
            Sign out
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
