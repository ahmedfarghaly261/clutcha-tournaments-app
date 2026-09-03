import type * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em]',
  {
    variants: {
      variant: {
        default: 'border-[#3d4352] bg-[#1d2129] text-[#cbd7e9]',
        success: 'border-[#276f5c] bg-[#15382f] text-[#8ff5d8]',
        warning: 'border-[#795f34] bg-[#382c19] text-[#ffd08b]',
        info: 'border-[#2b7080] bg-[#153642] text-[#9ceaff]',
        accent: 'border-[#5f4670] bg-[#2a2132] text-[#d7a5ff]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant, className }))} {...props} />
}

export { Badge }
