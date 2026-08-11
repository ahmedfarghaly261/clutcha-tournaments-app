import { useId, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  Building2,
  ChevronDown,
  Gamepad2,
  Globe2,
  IdCard,
  Lock,
  Mail,
  ShieldUser,
  Trophy,
  UsersRound,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { roleHomePath } from '@/app/config/roles'
import {
  registrationSchema,
  type RegistrationAccountType,
  type RegistrationFormValues,
} from '../schemas/registration.schema'
import { useRegistrationService } from '../services/registration.service'

type RegistrationExperienceProps = {
  initialAccountType: RegistrationAccountType
}

const accountTypeOptions: Array<{
  value: RegistrationAccountType
  label: string
  icon: LucideIcon
}> = [
  { value: 'captain', label: 'Team Captain', icon: ShieldUser },
  { value: 'organizer', label: 'Tournament Organizer', icon: Building2 },
]

const regions = [
  { value: '', label: 'Select Region' },
  { value: 'mena', label: 'MENA' },
  { value: 'europe', label: 'Europe' },
  { value: 'north-america', label: 'North America' },
  { value: 'asia-pacific', label: 'Asia-Pacific' },
  { value: 'latin-america', label: 'Latin America' },
]

const registrationPathByType: Record<RegistrationAccountType, string> = {
  captain: '/register/captain',
  organizer: '/register/organizer',
}

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ')

const labelClass =
  'mb-2.5 block text-[0.77rem] font-extrabold tracking-[0.08em] text-[#d9cfdf]'

const inputShellClass = (invalid = false, select = false) =>
  cx(
    'grid min-h-[62px] items-center border bg-[#131315] transition-[border-color,box-shadow] duration-150',
    'focus-within:border-[#ddb7ff] focus-within:shadow-[0_0_0_2px_rgba(221,183,255,0.2)]',
    select
      ? 'grid-cols-[44px_minmax(0,1fr)_44px]'
      : 'grid-cols-[44px_minmax(0,1fr)]',
    invalid
      ? 'border-[rgba(255,180,171,0.8)]'
      : 'border-[rgba(77,67,84,0.78)]',
  )

const fieldControlClass =
  'w-full min-w-0 border-0 bg-transparent font-[inherit] text-[#f2eef4] outline-0 placeholder:text-[rgba(207,194,214,0.48)]'

function getRegistrationErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 409) {
      return 'That email is already registered. Try signing in instead.'
    }

    if (error.response?.status === 400) {
      return 'Check your account details and try again.'
    }

    if (error.response?.status === 429) {
      return 'Too many attempts. Give it a minute, then try again.'
    }
  }

  return 'Could not create your account. Please try again.'
}

export function RegistrationExperience({
  initialAccountType,
}: RegistrationExperienceProps) {
  const navigate = useNavigate()
  const { registerAccount } = useRegistrationService()
  const [formError, setFormError] = useState<string | null>(null)
  const formId = useId()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      accountType: initialAccountType,
      displayName: '',
      email: '',
      password: '',
      region: '',
      termsAccepted: false,
    },
  })

  const accountType = useWatch({ control, name: 'accountType' })
  const isCaptain = accountType === 'captain'

  const selectAccountType = (nextAccountType: RegistrationAccountType) => {
    setValue('accountType', nextAccountType, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    navigate(registrationPathByType[nextAccountType], { replace: true })
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)

    try {
      const user = await registerAccount(values)
      navigate(roleHomePath[user.role], { replace: true })
    } catch (error) {
      setFormError(getRegistrationErrorMessage(error))
    }
  })

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#09090b] bg-[radial-gradient(circle_at_24%_0%,rgba(221,183,255,0.18),transparent_34%),radial-gradient(circle_at_70%_100%,rgba(76,215,246,0.12),transparent_32%),linear-gradient(135deg,#09090b_0%,#131315_48%,#0e0e10_100%)] px-5 py-8 text-[#e5e1e4] max-[560px]:block max-[560px]:bg-[#0e0e10] max-[560px]:p-0">
      <div className="pointer-events-none absolute left-[18%] top-[-160px] h-[560px] w-[560px] rounded-full bg-[rgba(221,183,255,0.18)] opacity-80 blur-[96px]" />
      <div className="pointer-events-none absolute bottom-[-180px] right-[18%] h-[440px] w-[440px] rounded-full bg-[rgba(76,215,246,0.14)] opacity-80 blur-[96px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(229,225,228,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(229,225,228,0.045)_1px,transparent_1px)] bg-[length:40px_40px] [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]" />

      <section
        className="relative z-10 grid min-h-[720px] w-[min(100%,1120px)] grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)] overflow-hidden rounded-2xl border border-[rgba(77,67,84,0.55)] bg-[#0e0e10] shadow-[0_32px_80px_rgba(0,0,0,0.22),0_0_0_1px_rgba(255,255,255,0.02)_inset] max-[900px]:min-h-0 max-[900px]:grid-cols-1 max-[560px]:min-h-screen max-[560px]:w-full max-[560px]:rounded-none max-[560px]:border-0"
        aria-labelledby={`${formId}-title`}
      >
        <aside
          className="relative flex min-h-full flex-col justify-between overflow-hidden border-r border-[rgba(77,67,84,0.45)] bg-[linear-gradient(to_bottom,rgba(14,14,16,0.2),rgba(14,14,16,0.96)),radial-gradient(circle_at_65%_8%,rgba(221,183,255,0.2),transparent_18%),radial-gradient(circle_at_32%_36%,rgba(76,215,246,0.16),transparent_14%),url('/registration.png')] bg-cover bg-center px-10 py-12 max-[900px]:hidden"
          aria-label="CLUTCHA platform"
        >
          <div className="absolute inset-0 opacity-30 bg-[linear-gradient(140deg,rgba(255,255,255,0.05),transparent_26%),repeating-linear-gradient(-14deg,rgba(255,255,255,0.035)_0_2px,transparent_2px_22px)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_42%_52%,transparent_0_12%,rgba(0,0,0,0.22)_34%),linear-gradient(to_top,#131315_4%,rgba(19,19,21,0.55)_48%,rgba(19,19,21,0.08))]" />

          <div className="relative z-10 m-0 font-sans text-[clamp(2rem,4vw,2.75rem)] font-extrabold leading-none tracking-[-0.06em] text-[#ddb7ff] drop-shadow-[0_0_24px_rgba(221,183,255,0.18)]">
            CLUTCHA
          </div>

          <div className="relative z-10">
            <h2 className="mb-4 font-sans text-[2rem] font-extrabold leading-[1.15] tracking-[-0.04em] text-[#f7f4f8]">
              Command Central.
            </h2>
            <p className="mb-8 max-w-[340px] text-base leading-[1.7] text-[#d6ccdc]">
              Join the premier infrastructure for professional esports tournament
              management and team coordination.
            </p>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.08em] text-[#cfc2d6]">
              <span
                className="mr-[-18px] grid h-8 w-8 place-items-center rounded-full border-2 border-[#131315] bg-[#353437] text-[0.8rem]"
                aria-hidden="true"
              >
                <Gamepad2 className="h-4 w-4" />
              </span>
              <span
                className="mr-[-18px] grid h-8 w-8 place-items-center rounded-full border-2 border-[#131315] bg-[#353437] text-[0.8rem]"
                aria-hidden="true"
              >
                <Trophy className="h-4 w-4" />
              </span>
              <span
                className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#131315] bg-[#353437] text-[0.8rem]"
                aria-hidden="true"
              >
                <UsersRound className="h-4 w-4" />
              </span>
              <strong className="ml-6">Trusted by 10k+ Pros</strong>
            </div>
          </div>
        </aside>

        <div className="flex flex-col justify-center bg-[#0e0e10] px-10 py-12 max-[900px]:px-6 max-[900px]:py-8 max-[560px]:px-[18px] max-[560px]:py-7">
          <p className="mb-7 hidden text-center font-sans text-[clamp(2rem,4vw,2.75rem)] font-extrabold leading-none tracking-[-0.06em] text-[#ddb7ff] drop-shadow-[0_0_24px_rgba(221,183,255,0.18)] max-[900px]:block">
            CLUTCHA
          </p>
          <header className="mb-7">
            <h1
              className="mb-2 font-sans text-[2rem] font-extrabold leading-[1.15] tracking-[-0.04em] text-[#f5f1f6]"
              id={`${formId}-title`}
            >
              Create Account
            </h1>
            <p className="m-0 text-base text-[#cfc2d6]">
              Setup your infrastructure.
            </p>
          </header>

          <form className="grid gap-5" onSubmit={onSubmit} noValidate>
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className={cx(labelClass, 'uppercase')}>Account Type</legend>
              <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
                {accountTypeOptions.map((option) => {
                  const Icon = option.icon

                  return (
                    <label
                      className={cx(
                        'grid min-h-[104px] cursor-pointer place-items-center gap-2.5 rounded-[10px] border bg-[#1c1b1d] text-center text-[#e5e1e4] transition-[border-color,background,color,transform] duration-150 hover:-translate-y-px hover:border-[#ddb7ff] hover:bg-[rgba(221,183,255,0.07)] hover:text-[#f0dbff]',
                        accountType === option.value
                          ? 'border-[#ddb7ff] bg-[rgba(221,183,255,0.07)] text-[#f0dbff]'
                          : 'border-[rgba(77,67,84,0.78)]',
                      )}
                      key={option.value}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        value={option.value}
                        checked={accountType === option.value}
                        onChange={() => selectAccountType(option.value)}
                      />
                      <Icon className="h-7 w-7 text-[#d6ccdc]" aria-hidden="true" />
                      <strong className="text-[0.88rem] tracking-[-0.01em]">
                        {option.label}
                      </strong>
                    </label>
                  )
                })}
              </div>
              <p className="mt-3.5 text-[0.83rem] italic leading-[1.55] text-[rgba(207,194,214,0.76)]">
                Note: Individual players are managed directly by their Team
                Captains as roster records.
              </p>
            </fieldset>

            <input type="hidden" {...register('accountType')} />

            <div className="grid gap-4">
              <div className="min-w-0">
                <label className={labelClass} htmlFor={`${formId}-display-name`}>
                  Full Name / Organization
                </label>
                <div className={inputShellClass(!!errors.displayName)}>
                  <span
                    className="grid h-full place-items-center text-[1.1rem] font-black text-[#cfc2d6]"
                    aria-hidden="true"
                  >
                    <IdCard className="h-5 w-5" />
                  </span>
                  <input
                    className={fieldControlClass}
                    id={`${formId}-display-name`}
                    type="text"
                    autoComplete={isCaptain ? 'name' : 'organization'}
                    placeholder={isCaptain ? 'John Doe' : 'CLUTCHA Arena Cairo'}
                    {...register('displayName')}
                  />
                </div>
                {errors.displayName && (
                  <p
                    className="mt-2 text-[0.78rem] leading-[1.45] text-[#ffb4ab]"
                    role="alert"
                  >
                    {errors.displayName.message}
                  </p>
                )}
              </div>

              <div className="min-w-0">
                <label className={labelClass} htmlFor={`${formId}-email`}>
                  Work Email
                </label>
                <div className={inputShellClass(!!errors.email)}>
                  <span
                    className="grid h-full place-items-center text-[1.1rem] font-black text-[#cfc2d6]"
                    aria-hidden="true"
                  >
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    className={fieldControlClass}
                    id={`${formId}-email`}
                    type="email"
                    autoComplete="email"
                    placeholder="john@team.com"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p
                    className="mt-2 text-[0.78rem] leading-[1.45] text-[#ffb4ab]"
                    role="alert"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="min-w-0">
                <label className={labelClass} htmlFor={`${formId}-password`}>
                  Secure Password
                </label>
                <div className={inputShellClass(!!errors.password)}>
                  <span
                    className="grid h-full place-items-center text-[1.1rem] font-black text-[#cfc2d6]"
                    aria-hidden="true"
                  >
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    className={fieldControlClass}
                    id={`${formId}-password`}
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p
                    className="mt-2 text-[0.78rem] leading-[1.45] text-[#ffb4ab]"
                    role="alert"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="min-w-0">
                <label className={labelClass} htmlFor={`${formId}-region`}>
                  Region / Country
                </label>
                <div className={inputShellClass(false, true)}>
                  <span
                    className="grid h-full place-items-center text-[1.1rem] font-black text-[#cfc2d6]"
                    aria-hidden="true"
                  >
                    <Globe2 className="h-5 w-5" />
                  </span>
                  <select
                    className={cx(fieldControlClass, 'cursor-pointer appearance-none')}
                    id={`${formId}-region`}
                    {...register('region')}
                  >
                    {regions.map((region) => (
                      <option
                        className="bg-[#201f22] text-[#f2eef4]"
                        key={region.value}
                        value={region.value}
                      >
                        {region.label}
                      </option>
                    ))}
                  </select>
                  <span
                    className="grid h-full place-items-center text-[1.1rem] font-black text-[#cfc2d6]"
                    aria-hidden="true"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </span>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 text-[0.92rem] leading-[1.45] text-[#d6ccdc]">
              <input
                className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[#ddb7ff]"
                type="checkbox"
                {...register('termsAccepted')}
              />
              <span>
                I agree to the{' '}
                <a
                  className="font-extrabold text-[#ddb7ff] underline decoration-[rgba(221,183,255,0.38)] underline-offset-[3px]"
                  href="/terms"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  className="font-extrabold text-[#ddb7ff] underline decoration-[rgba(221,183,255,0.38)] underline-offset-[3px]"
                  href="/privacy"
                >
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            {errors.termsAccepted && (
              <p
                className="mt-[-12px] text-[0.78rem] leading-[1.45] text-[#ffb4ab]"
                role="alert"
              >
                {errors.termsAccepted.message}
              </p>
            )}

            {formError && (
              <p
                className="m-0 rounded-[10px] border border-[rgba(255,180,171,0.5)] bg-[rgba(147,0,10,0.22)] px-3.5 py-3 text-[0.88rem] text-[#ffdad6]"
                role="alert"
              >
                {formError}
              </p>
            )}

            <button
              className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-3 border-0 bg-[#ddb7ff] px-6 py-3 text-[0.78rem] font-black uppercase tracking-[0.2em] text-[#490080] transition-[background,transform,opacity] duration-150 hover:-translate-y-px hover:bg-[#f0dbff] disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>

            <p className="m-0 text-center text-[#d6ccdc]">
              Already deployed?{' '}
              <Link
                className="font-extrabold text-[#ddb7ff] underline decoration-[rgba(221,183,255,0.38)] underline-offset-[3px]"
                to="/sign-in"
              >
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}
