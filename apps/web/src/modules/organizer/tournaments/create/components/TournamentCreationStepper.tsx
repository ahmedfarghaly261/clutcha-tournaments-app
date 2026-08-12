import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TournamentCreationStep } from '../types/tournament-creation.types'

const steps = [
  { number: 1 as const, label: 'Basic Info' },
  { number: 2 as const, label: 'Format & Rules' },
  { number: 3 as const, label: 'Prizes' },
  { number: 4 as const, label: 'Review' },
]

type TournamentCreationStepperProps = {
  currentStep: TournamentCreationStep
  onStepSelect: (step: TournamentCreationStep) => void
}

export function TournamentCreationStepper({
  currentStep,
  onStepSelect,
}: TournamentCreationStepperProps) {
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Tournament creation progress">
      {steps.map((step, index) => {
        const isComplete = step.number < currentStep
        const isCurrent = step.number === currentStep

        return (
          <li className="relative flex min-w-0 flex-col items-center" key={step.number}>
            {index > 0 && (
              <span
                className={cn(
                  'absolute right-1/2 top-[17px] -z-0 h-px w-[calc(100%-42px)] translate-x-[-21px]',
                  step.number <= currentStep ? 'bg-[#d7a5ff]' : 'bg-[#4a424e]',
                )}
                aria-hidden="true"
              />
            )}
            <Button
              className={cn(
                'relative z-10 h-9 w-9 rounded-full border p-0 text-xs font-black',
                isComplete && 'border-[#d7a5ff] bg-[#d7a5ff] text-[#24102f]',
                isCurrent && 'border-[#d7a5ff] bg-[#211b25] text-[#e8c9ff] ring-4 ring-[#d7a5ff]/10',
                !isComplete && !isCurrent && 'border-[#514856] bg-[#171519] text-[#8d8392]',
              )}
              type="button"
              onClick={() => onStepSelect(step.number)}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Go to ${step.label}`}
            >
              {isComplete ? <Check className="h-4 w-4" aria-hidden="true" /> : step.number}
            </Button>
            <span
              className={cn(
                'mt-2 truncate text-center text-[10px] font-black uppercase tracking-[0.08em] sm:text-xs',
                step.number <= currentStep ? 'text-[#e5c7fa]' : 'text-[#827988]',
              )}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
