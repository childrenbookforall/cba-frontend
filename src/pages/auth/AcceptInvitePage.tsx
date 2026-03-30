import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getInvite, acceptInvite } from '../../api/auth'
import { getMe } from '../../api/users'
import { useAuthStore } from '../../stores/authStore'
import { getApiError } from '../../lib/utils'
import type { InviteInfo } from '../../types/api'
import Spinner from '../../components/ui/Spinner'
import PasswordInput from '../../components/ui/PasswordInput'
import logoWithName from '../../assets/logo-with-name.png'

const passwordSchema = z
  .string()
  .min(6, 'At least 6 characters')

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().optional(),
  password: passwordSchema,
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
})

type Fields = z.infer<typeof schema>

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!token) return
    getInvite(token)
      .then((info) => {
        setInviteInfo(info)
        reset({ firstName: info.firstName, lastName: info.lastName ?? '' })
      })
      .catch((err) => setLoadError(getApiError(err)))
  }, [token])

  async function onSubmit(data: Fields) {
    if (!token) return
    try {
      const { token: jwt } = await acceptInvite(token, data.password, data.firstName, data.lastName ?? '')
      useAuthStore.getState().setAuth(jwt, { id: '', email: '', firstName: '', lastName: '', role: 'member', createdAt: '' })
      const user = await getMe()
      setAuth(jwt, user)
      navigate('/feed', { replace: true })
    } catch (err) {
      setError('root', { message: getApiError(err) })
    }
  }

  // Loading state
  if (!inviteInfo && !loadError) {
    return (
      <div className="min-h-svh bg-surface flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  // Invalid / expired invite
  if (loadError) {
    return (
      <div className="min-h-svh bg-card sm:bg-surface flex flex-col sm:items-center sm:justify-center sm:px-4">
        <div className="flex-1 sm:flex-none w-full sm:max-w-sm bg-card sm:rounded-2xl sm:shadow-sm p-8 flex flex-col justify-center text-center">
          <div className="text-3xl mb-3">✉️</div>
          <h1 className="text-base font-bold text-gray-900 mb-2">Invite unavailable</h1>
          <p className="text-xs text-muted leading-relaxed">{loadError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-card sm:bg-surface flex flex-col sm:items-center sm:justify-center sm:px-4">
      <title>Join CBA Community</title>
      <div className="flex-1 sm:flex-none w-full sm:max-w-sm bg-card sm:rounded-2xl sm:shadow-sm p-8 flex flex-col justify-center">

        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src={logoWithName}
            alt="Children's Book for All"
            className="h-16 mx-auto mb-3 object-contain"
          />
          <p className="text-xs text-muted leading-relaxed">A loving and nurturing community<br />anchored in children's books</p>
        </div>

        {/* Welcome banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 mb-6">
          <p className="text-xs text-reaction-hm leading-relaxed text-center">
            Welcome, {inviteInfo!.firstName}! 🎉<br />You've been invited to join the CBA community forum.
          </p>
        </div>

        {/* Email (read-only) */}
        <div className="mb-5">
          <label className="block text-[0.625rem] font-bold text-muted uppercase tracking-wide mb-1">Email</label>
          <div className="w-full px-3 py-2.5 rounded-xl border border-border bg-gray-100 text-sm text-muted">
            {inviteInfo!.email}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* First Name */}
          <div className="mb-3">
            <label className="block text-[0.625rem] font-bold text-muted uppercase tracking-wide mb-1">First Name</label>
            <input
              type="text"
              autoComplete="given-name"
              className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${errors.firstName ? 'border-danger bg-red-50' : 'border-border bg-white'}`}
              {...register('firstName')}
            />
            {errors.firstName && (
              <p className="text-[0.625rem] text-danger mt-1">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="mb-5">
            <label className="block text-[0.625rem] font-bold text-muted uppercase tracking-wide mb-1">Last Name <span className="normal-case font-normal">(optional)</span></label>
            <input
              type="text"
              autoComplete="family-name"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              {...register('lastName')}
            />
          </div>
          {/* Password */}
          <div className="mb-3">
            <label className="block text-[0.625rem] font-bold text-muted uppercase tracking-wide mb-1">
              Set Password
            </label>
            <PasswordInput
              autoComplete="new-password"
              placeholder="Min 6 characters"
              hasError={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-[0.625rem] text-danger mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm */}
          <div className="mb-5">
            <label className="block text-[0.625rem] font-bold text-muted uppercase tracking-wide mb-1">
              Confirm Password
            </label>
            <PasswordInput
              autoComplete="new-password"
              placeholder="Re-enter password"
              hasError={!!errors.confirm}
              {...register('confirm')}
            />
            {errors.confirm && (
              <p className="text-[0.625rem] text-danger mt-1">{errors.confirm.message}</p>
            )}
          </div>

          {errors.root && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs text-danger">{errors.root.message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition"
          >
            {isSubmitting && <Spinner size="sm" />}
            Join Community
          </button>
        </form>
      </div>
    </div>
  )
}
