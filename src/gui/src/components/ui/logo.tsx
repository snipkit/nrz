import { forwardRef } from 'react'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils.ts'

export const Logo = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-row items-center justify-center',
      className,
    )}>
    <h1 className="flex items-center justify-center">
      <span className="pr-2 text-2xl font-semibold leading-none tracking-wide">
        nrz
      </span>
      <span className="text-2xl font-light leading-none tracking-wide text-neutral-500">
        {'/vōlt/'}
      </span>
    </h1>
  </div>
))
Logo.displayName = 'Logo'
