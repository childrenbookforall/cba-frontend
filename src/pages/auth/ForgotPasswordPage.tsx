import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../../api/auth'
import { getApiError } from '../../lib/utils'
import Spinner from '../../components/ui/Spinner'
import logoWithName from '../../assets/logo-with-name.png'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type Fields = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<Fields>({ resolver: zodResolver(schema) })

  async function onSubmit(data: Fields) {
    try {
      await forgotPassword(data.email)
    } catch (err) {
      setError('root', { message: getApiError(err) })
    }
  }

  return (
    <div className="min-h-svh bg-card sm:bg-surface flex flex-col sm:items-center sm:justify-center sm:px-4">
      <title>Reset Password — CBA</title>
      <div className="flex-1 sm:flex-none w-full sm:max-w-sm bg-card sm:rounded-2xl sm:shadow-sm p-8 flex flex-col justify-center">

        <div className="text-center mb-6">
          <img src={logoWithName} alt="Children's Book for All" className="h-16 mx-auto object-contain" />
        </div>
        <h1 className="text-base font-bold text-gray-900 mb-1">Reset your password</h1>
        <p className="text-xs text-muted mb-6 leading-relaxed">
          Enter your email and we'll send a reset link if your account exists.
        </p>

        {errors.root && (
          <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs text-danger">{errors.root.message}</p>
          </div>
        )}

        {isSubmitSuccessful ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-reaction-hm mb-1">✓ Link sent!</p>
            <p className="text-xs text-reaction-hm">Check your inbox. The link expires in 1 hour.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-5">
              <label className="block text-[0.625rem] font-bold text-muted uppercase tracking-wide mb-1">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                {...register('email')}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${
                  errors.email ? 'border-danger bg-red-50' : 'border-border'
                }`}
              />
              {errors.email && (
                <p className="text-[0.625rem] text-danger mt-1">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition"
            >
              {isSubmitting && <Spinner size="sm" />}
              Send Reset Link
            </button>
          </form>
        )}

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
