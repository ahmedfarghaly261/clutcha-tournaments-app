import { SignInForm } from '../components/SignInForm'

export function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-[#e5e1e4]">
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-8">
        <div className="absolute inset-0 z-0 bg-[url('/registration.png')] bg-cover bg-center opacity-20" />
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_16%,rgba(221,183,255,0.14),transparent_28%),linear-gradient(to_bottom,rgba(9,9,11,0.62),rgba(9,9,11,0.94))]" />
        <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(229,225,228,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(229,225,228,0.04)_1px,transparent_1px)] bg-[length:44px_44px] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]" />

        <section
          className="relative z-10 w-full max-w-md rounded-xl border border-[#27272a] bg-[rgba(24,24,27,0.86)] p-6 shadow-2xl shadow-black/40 backdrop-blur-md"
          aria-labelledby="sign-in-title"
        >
          <div className="mb-8 flex justify-center">
            <img
              className="h-24 w-24 rounded-2xl object-contain shadow-[0_0_48px_rgba(132,43,210,0.18)]"
              src="/logo.png"
              alt="CLUTCHA Logo"
            />
          </div>

          <header className="mb-6 text-center">
            <h1
              className="mb-2 font-sans text-[2rem] font-bold leading-[1.2] tracking-[-0.03em] text-[#e5e1e4]"
              id="sign-in-title"
            >
              Sign In
            </h1>
            <p className="text-sm leading-6 text-[#cfc2d6]">
              Access your command center.
            </p>
          </header>

          <SignInForm />
        </section>
      </main>

      <footer className="relative z-10 flex w-full flex-col items-center justify-between gap-4 border-t border-[#4d4354] bg-[#0e0e10] px-6 py-8 text-center md:flex-row">
        <div className="text-lg font-semibold tracking-[-0.01em] text-[#e5e1e4]">
          CLUTCHA
        </div>
        <div className="text-sm leading-6 text-[#cfc2d6]">
          © 2026 CLUTCHA. High-Performance Infrastructure for Global Competition.
        </div>
        <nav className="flex flex-wrap justify-center gap-5 text-sm leading-6">
          <a className="text-[#cfc2d6] transition-colors hover:text-[#4cd7f6]" href="/terms">
            Terms
          </a>
          <a className="text-[#cfc2d6] transition-colors hover:text-[#4cd7f6]" href="/privacy">
            Privacy
          </a>
          <a className="text-[#cfc2d6] transition-colors hover:text-[#4cd7f6]" href="/security">
            Security
          </a>
        </nav>
      </footer>
    </div>
  )
}
