import { Input as InputPrimitive } from '@base-ui/react/input'
import type * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'h-12 w-full min-w-0 rounded-md border border-[#49404e] bg-[#141215] px-3 text-sm text-[#f8f4fa] outline-none transition placeholder:text-[#766c7c] focus-visible:border-[#d7a5ff] focus-visible:ring-2 focus-visible:ring-[#d7a5ff]/10 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[#ff8f87]',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
