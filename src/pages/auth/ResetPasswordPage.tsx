import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { validateResetToken, resetPassword } from '../../api/auth'
import { getApiError } from '../../lib/utils'
import Spinner from '../../components/ui/Spinner'
import logoWithName from '../../assets/logo-with-name.png'

const passwordSchema = z
  .string()
  .min(10, 'At least 10 characters')
  .regex(/[A-Z]/, 'Must include an uppercase letter')
  .regex(/[a-z]/, 'Must include a lowercase letter')
  .regex(/[0-9]/, 'Must include a number')
  .regex(/[^A-Za-z0-9]/, 'Must include a special character')

const schema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type Fields = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [tokenState, setTokenState] = useState<'loading' | 'valid' | 'invalid'>('loading')
  const [tokenError, setTokenError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    validateResetToken(token)
      .then(() => setTokenState('valid'))
      .catch((err) => {
        setTokenError(getApiError(err))
        setTokenState('invalid')
      })
  }, [token])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(schema) })

  async function onSubmit(data: Fields) {
    if (!token) return
    try {
      await resetPassword(token, data.password)
      navigate('/login', { replace: true, state: { passwordReset: true } })
    } catch (err) {
      setError('root', { message: getApiError(err) })
    }
  }

  if (tokenState === 'loading') {
    return (
      <div className="min-h-svh bg-surface flex items-center justify-center">
        <title>Reset Password — CBA</title>
        <Spinner />
      </div>
    )
  }

  if (tokenState === 'invalid') {
    return (
      <div className="min-h-svh bg-surface flex items-center justify-center px-4">
        <title>Reset Password — CBA</title>
        <div className="w-full max-w-sm bg-card rounded-2xl shadow-sm p-8 text-center">
          <div className="text-center mb-6">
            <img src={logoWithName} alt="Children's Book for All" className="h-16 mx-auto object-contain" />
          </div>
          <h1 className="text-base font-bold text-gray-900 mb-2">Link unavailable</h1>
          <p className="text-xs text-muted leading-relaxed mb-6">{tokenError}</p>
          <Link
            to="/forgot-password"
            className="block w-full py-3 bg-primary text-white text-sm font-bold rounded-xl text-center"
          >
            Request a new link
          </Link>
          <Link to="/login" className="block text-center text-xs text-muted mt-4 hover:text-primary transition">
            ← Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-surface flex items-center justify-center px-4">
      <title>Reset Password — CBA</title>
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-sm p-8">

        <div className="text-center mb-6">
          <img src={logoWithName} alt="Children's Book for All" className="h-16 mx-auto object-contain" />
        </div>
        <h1 className="text-base font-bold text-gray-900 mb-1">Set new password</h1>
        <p className="text-xs text-muted mb-6 leading-relaxed">
          Choose a strong password for your account.
        </p>

        {errors.root && (
          <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs text-danger">{errors.root.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-3">
            <label className="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">
              New Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Min 10 chars · Upper · Number · Symbol"
              {...register('password')}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${
                errors.password ? 'border-danger bg-red-50' : 'border-border'
              }`}
            />
            {errors.password && (
              <p className="text-[10px] text-danger mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter new password"
              {...register('confirm')}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${
                errors.confirm ? 'border-danger bg-red-50' : 'border-border'
              }`}
            />
            {errors.confirm && (
              <p className="text-[10px] text-danger mt-1">{errors.confirm.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition"
          >
            {isSubmitting && <Spinner size="sm" />}
            Set Password
          </button>
        </form>

        <Link
          to="/login"
          className="block text-center text-xs text-muted mt-4 hover:text-primary transition"
        >
          ← Back to login
        </Link>
      </div>
    </div>
  )
}
