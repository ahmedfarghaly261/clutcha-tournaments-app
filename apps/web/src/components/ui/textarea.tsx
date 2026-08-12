import type * as React from 'react'
import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-28 w-full resize-y rounded-md border border-[#49404e] bg-[#141215] px-3 py-3 text-sm text-[#f8f4fa] outline-none transition placeholder:text-[#766c7c] focus-visible:border-[#d7a5ff] focus-visible:ring-2 focus-visible:ring-[#d7a5ff]/10 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[#ff8f87]',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
