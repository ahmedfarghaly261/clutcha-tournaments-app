import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-transparent text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#d7a5ff]/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-[#d7a5ff] text-[#2a0b3f] hover:bg-[#e4c0ff]',
        outline: 'border-[#4b424f] bg-transparent text-[#eee8f1] hover:bg-[#29232c]',
        secondary: 'bg-[#29232c] text-[#eee8f1] hover:bg-[#342d38]',
        ghost: 'text-[#eee8f1] hover:bg-[#29232c]',
        destructive: 'bg-[#6d2830] text-[#ffdad6] hover:bg-[#82323b]',
        link: 'text-[#d7a5ff] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 gap-2 px-4',
        sm: 'h-8 gap-1.5 px-3 text-xs',
        lg: 'h-11 gap-2 px-6',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button }
