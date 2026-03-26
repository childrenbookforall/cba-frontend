import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { getMe } from '../../api/users'
import { useAuthStore } from '../../stores/authStore'
import { getApiError } from '../../lib/utils'
import Spinner from '../../components/ui/Spinner'
import logoWithName from '../../assets/logo-with-name.png'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type Fields = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(schema) })

  async function onSubmit(data: Fields) {
    try {
      const { token } = await login(data.email, data.password)
      // Store token first so getMe() request is authenticated
      useAuthStore.getState().setAuth(token, { id: '', email: '', firstName: '', lastName: '', role: 'member', createdAt: '' })
      const user = await getMe()
      setAuth(token, user)
      navigate('/feed', { replace: true })
    } catch (err) {
      setError('root', { message: getApiError(err) })
    }
  }

  return (
    <div className="min-h-svh bg-surface flex items-center justify-center px-4">
      <title>Sign In — CBA</title>
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-sm p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={logoWithName}
            alt="Children's Book for All"
            className="h-16 mx-auto mb-3 object-contain"
          />
          <p className="text-xs text-muted leading-relaxed">A loving and nurturing community<br />anchored in children's books</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email */}
          <div className="mb-4">
            <label className="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register('email')}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${
                errors.email ? 'border-danger bg-red-50' : 'border-border'
              }`}
            />
            {errors.email && (
              <p className="text-[10px] text-danger mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••"
              {...register('password')}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${
                errors.password ? 'border-danger bg-red-50' : 'border-border'
              }`}
            />
            {errors.password && (
              <p className="text-[10px] text-danger mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* API error */}
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
            Sign In
          </button>
        </form>

        <Link
          to="/forgot-password"
          className="block text-center text-xs text-muted mt-4 hover:text-primary transition"
        >
          Forgot password?
        </Link>
      </div>
    </div>
  )
}
