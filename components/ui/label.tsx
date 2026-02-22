import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

function Label({ className, ...props }: ComponentProps<'label'>) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: This primitive wraps native <label> and consumers provide htmlFor/children.
    <label
      className={cn(
        'text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      data-slot='label'
      {...props}
    />
  )
}

export { Label }
