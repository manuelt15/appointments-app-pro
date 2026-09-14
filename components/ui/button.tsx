import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-sm border border-transparent bg-clip-padding text-sm font-medium outline-none transition-[background-color,border-color,color,transform] duration-150 ease-out select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground can-hover:hover:bg-primary/80',
        outline: 'border-border bg-card text-foreground can-hover:hover:bg-muted aria-expanded:bg-muted',
        secondary: 'bg-secondary text-secondary-foreground can-hover:hover:bg-muted/70 aria-expanded:bg-secondary',
        ghost: 'text-body can-hover:hover:bg-muted can-hover:hover:text-foreground aria-expanded:bg-muted',
        destructive: 'bg-destructive/10 text-destructive can-hover:hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20',
        link: 'text-link underline-offset-4 can-hover:hover:underline',
      },
      size: {
        default: 'h-11 gap-2 px-4 sm:h-10',
        xs: 'h-9 gap-1 px-2 text-xs sm:h-7 [&_svg:not([class*="size-"])]:size-3',
        sm: 'h-10 gap-1 px-2.5 text-[0.8rem] sm:h-8 [&_svg:not([class*="size-"])]:size-3.5',
        lg: 'h-12 gap-2 px-5 sm:h-11',
        icon: 'size-11 sm:size-10',
        'icon-xs': 'size-11 sm:size-7 [&_svg:not([class*="size-"])]:size-3',
        'icon-sm': 'size-11 sm:size-8',
        'icon-lg': 'size-12 sm:size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Component = asChild ? Slot.Root : 'button'

  return (
    <Component
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
