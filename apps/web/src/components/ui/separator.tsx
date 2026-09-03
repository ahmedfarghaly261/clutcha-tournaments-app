import type * as React from 'react'
import { cn } from '@/lib/utils'

function Separator({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="separator" role="separator" className={cn('h-px w-full bg-[#343037]', className)} {...props} />
}

export { Separator }
