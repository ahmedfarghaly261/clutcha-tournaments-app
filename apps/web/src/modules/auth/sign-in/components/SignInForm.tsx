import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { useSignIn } from '../hooks/useSignIn'
import { signInSchema, type SignInFormValues } from '../schemas/sign-in.schema'

const labelClass =
  'mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-[#cfc2d6]'

const inputClass =
  'w-full rounded-md border border-[#27272a] bg-[#09090b] py-3 pl-11 pr-3 text-sm leading-6 text-[#e5e1e4] outline-none transition-[border-color,box-shadow] placeholder:text-[rgba(207,194,214,0.45)] focus:border-[#ddb7ff] focus:shadow-[0_0_0_2px_rgba(221,183,255,0.2)]'

function getSignInErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 401) {
      return 'Invalid email or password.'
    }

    if (error.response?.status === 403) {
      return 'This account cannot sign in right now.'
    }

    if (error.response?.status === 429) {
      return 'Too many sign-in attempts. Give it a minute, then try again.'
    }
  }

  return 'Could not sign in. Please try again.'
}

export function SignInForm() {
  const { signIn } = useSignIn()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)

    try {
      await signIn(values)
    } catch (error) {
      setFormError(getSignInErrorMessage(error))
    }
  })

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <div>
        <label className={labelClass} htmlFor="sign-in-email">
          Email Address
        </label>
        <div className="relative">
          <span
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#cfc2d6]"
            aria-hidden="true"
          >
            @
          </span>
          <input
            className={inputClass}
            id="sign-in-email"
            type="email"
            autoComplete="email"
            placeholder="commander@clutcha.gg"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="mt-2 text-xs leading-5 text-[#ffb4ab]" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-4">
          <label
            className="block text-xs font-semibold uppercase tracking-[0.05em] text-[#cfc2d6]"
            htmlFor="sign-in-password"
          >
            Password
          </label>
          <a
            className="text-xs font-semibold uppercase tracking-[0.05em] text-[#ddb7ff] transition-colors hover:text-[#b76dff]"
            href="/forgot-password"
          >
            Forgot Password?
          </a>
        </div>
        <div className="relative">
          <span
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#cfc2d6]"
            aria-hidden="true"
          >
            **
          </span>
          <input
            className={inputClass}
            id="sign-in-password"
            type="password"
            autoComplete="current-password"
            placeholder="********"
            {...register('password')}
          />
        </div>
        {errors.password && (
          <p className="mt-2 text-xs leading-5 text-[#ffb4ab]" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <label className="flex items-center gap-3 pt-2 text-sm leading-6 text-[#cfc2d6]">
        <input
          className="h-4 w-4 rounded-sm border-[#27272a] bg-[#09090b] accent-[#ddb7ff]"
          type="checkbox"
          {...register('rememberMe')}
        />
        <span>Remember me for 30 days</span>
      </label>

      {formError && (
        <p
          className="rounded-md border border-[rgba(255,180,171,0.5)] bg-[rgba(147,0,10,0.22)] px-3.5 py-3 text-sm text-[#ffdad6]"
          role="alert"
        >
          {formError}
        </p>
      )}

      <button
        className="flex w-full items-center justify-center gap-2 rounded-md bg-[#842bd2] px-6 py-3 text-lg font-semibold leading-[1.4] tracking-[-0.01em] text-white shadow-[0_0_15px_rgba(132,43,210,0.3)] transition-[background,box-shadow,opacity,transform] hover:-translate-y-px hover:bg-[#9d3bf3] hover:shadow-[0_0_20px_rgba(157,59,243,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isSubmitting}
      >
        <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
        <span aria-hidden="true">-&gt;</span>
      </button>

      <p className="pt-2 text-center text-sm leading-6 text-[#cfc2d6]">
        New to CLUTCHA?{' '}
        <Link
          className="font-semibold text-[#ddb7ff] transition-colors hover:text-[#f0dbff] hover:underline"
          to="/register"
        >
          Create an account
        </Link>
      </p>
    </form>
  )
}
