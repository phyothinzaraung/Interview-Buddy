import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle, UserRoundPlus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '../../api/apiError'
import { useAuth } from '../../auth/AuthContext'
import AuthField from '../../components/auth/AuthField'
import AuthLayout from '../../components/auth/AuthLayout'

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Full name is required.').max(100, 'Name must be 100 characters or fewer.'),
  email: z.string().trim().min(1, 'Email is required.').email('Enter a valid email address.').max(254, 'Email must be 254 characters or fewer.'),
  password: z.string().min(12, 'Use at least 12 characters.').max(72, 'Password must be 72 characters or fewer.'),
  confirmPassword: z.string().min(1, 'Please confirm your password.'),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
})

type RegisterValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { register: createAccount, status: authStatus, error: authCheckError, retrySessionRestore } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const submit = handleSubmit(async (values) => {
    setServerError(null)
    setIsSubmitting(true)
    try {
      await createAccount(values)
      navigate('/', { replace: true })
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : 'We could not create your account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      description="Set up your workspace and start practicing for your next interview."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">Sign in</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {authStatus === 'error' && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-5 text-amber-800"><p>{authCheckError}</p><button type="button" onClick={() => void retrySessionRestore()} className="mt-2 font-semibold underline underline-offset-2">Retry session check</button></div>}
        {serverError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-700">{serverError}</div>}
        <AuthField
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Jordan Davis"
          registration={register('name')}
          error={errors.name?.message}
          disabled={isSubmitting}
        />
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
          autoComplete="new-password"
          placeholder="At least 12 characters"
          registration={register('password')}
          error={errors.password?.message}
          disabled={isSubmitting}
          trailing={(
            <button type="button" onClick={() => setShowPassword((shown) => !shown)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          )}
        />
        <AuthField
          label="Confirm password"
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Enter your password again"
          registration={register('confirmPassword')}
          error={errors.confirmPassword?.message}
          disabled={isSubmitting}
          trailing={(
            <button type="button" onClick={() => setShowConfirmPassword((shown) => !shown)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
              {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          )}
        />
        <p className="!mt-2 text-xs leading-5 text-slate-400">Use 12–72 characters. Your password is stored securely.</p>
        <button type="submit" disabled={isSubmitting} className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70">
          {isSubmitting ? <><LoaderCircle size={17} className="animate-spin" /> Creating account…</> : <><UserRoundPlus size={17} /> Create account</>}
        </button>
      </form>
    </AuthLayout>
  )
}
