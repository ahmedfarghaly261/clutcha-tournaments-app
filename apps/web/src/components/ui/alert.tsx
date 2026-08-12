import type * as React from 'react'
import { cn } from '@/lib/utils'

function Alert({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert" role="alert" className={cn('relative grid w-full gap-1 rounded-lg border px-4 py-3 text-sm', className)} {...props} />
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert-title" className={cn('font-bold', className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert-description" className={cn('text-sm leading-6', className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription }
