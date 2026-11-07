import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '../../api/apiError'
import AuthField from '../../components/auth/AuthField'
import AuthLayout from '../../components/auth/AuthLayout'
import { useAuth } from '../../auth/AuthContext'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').email('Enter a valid email address.').max(254, 'Email must be 254 characters or fewer.'),
  password: z.string().min(1, 'Password is required.').max(72, 'Password must be 72 characters or fewer.'),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, status: authStatus, error: authCheckError, retrySessionRestore } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const submit = handleSubmit(async (values) => {
    setServerError(null)
    setIsSubmitting(true)
    try {
      await login(values)
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'
      navigate(destination, { replace: true })
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : 'We could not sign you in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to your account"
      description="Pick up where you left off and keep preparing for what’s next."
      footer={<>New to Interview Buddy? <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">Create an account</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        {authStatus === 'error' && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-5 text-amber-800"><p>{authCheckError}</p><button type="button" onClick={() => void retrySessionRestore()} className="mt-2 font-semibold underline underline-offset-2">Retry session check</button></div>}
        {serverError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-700">{serverError}</div>}
        <AuthField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          registration={register('email')}
          error={errors.email?.message}
          disabled={isSubmitting}
        />
        <AuthField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Enter your password"
          registration={register('password')}
          error={errors.password?.message}
          disabled={isSubmitting}
          trailing={(
            <button type="button" onClick={() => setShowPassword((shown) => !shown)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          )}
        />
        <button type="submit" disabled={isSubmitting} className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70">
          {isSubmitting ? <><LoaderCircle size={17} className="animate-spin" /> Signing in…</> : <><LockKeyhole size={16} /> Sign in</>}
        </button>
        <p className="text-center text-xs text-slate-400">Secure access to your interview practice workspace</p>
      </form>
    </AuthLayout>
  )
}
