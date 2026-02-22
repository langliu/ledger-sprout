'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import type * as React from 'react'
import { DayPicker, getDefaultClassNames } from 'react-day-picker'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      className={cn('p-3', className)}
      classNames={{
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 bg-transparent p-0 opacity-80 hover:opacity-100',
          defaultClassNames.button_next,
        ),
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 bg-transparent p-0 opacity-80 hover:opacity-100',
          defaultClassNames.button_previous,
        ),
        caption_label: cn('text-sm font-medium', defaultClassNames.caption_label),
        day: cn('relative h-8 w-8 p-0 text-center text-sm', defaultClassNames.day),
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-8 p-0 font-normal aria-selected:opacity-100',
          defaultClassNames.day_button,
        ),
        disabled: cn('text-muted-foreground opacity-50', defaultClassNames.disabled),
        dropdown: cn('absolute inset-0 opacity-0', defaultClassNames.dropdown),
        dropdown_root: cn(
          'border-input focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] rounded-md border shadow-xs',
          defaultClassNames.dropdown_root,
        ),
        dropdowns: cn('flex h-7 items-center gap-1 text-sm', defaultClassNames.dropdowns),
        hidden: cn('invisible', defaultClassNames.hidden),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        month_caption: cn(
          'flex h-7 w-full items-center justify-center px-8',
          defaultClassNames.month_caption,
        ),
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        months: cn('relative flex flex-col gap-4 sm:flex-row', defaultClassNames.months),
        months_dropdown: cn('text-sm', defaultClassNames.months_dropdown),
        nav: cn(
          'absolute inset-x-0 top-0 flex w-full items-center justify-between',
          defaultClassNames.nav,
        ),
        outside: cn('text-muted-foreground opacity-50', defaultClassNames.outside),
        range_end: cn('rounded-r-md bg-accent', defaultClassNames.range_end),
        range_middle: cn('bg-accent', defaultClassNames.range_middle),
        range_start: cn('rounded-l-md bg-accent', defaultClassNames.range_start),
        root: cn('w-fit', defaultClassNames.root),
        selected: cn(
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
          defaultClassNames.selected,
        ),
        today: cn('bg-accent text-accent-foreground', defaultClassNames.today),
        week: cn('mt-2 flex w-full', defaultClassNames.week),
        weekday: cn(
          'text-muted-foreground h-8 w-8 rounded-md text-[0.8rem] font-normal',
          defaultClassNames.weekday,
        ),
        weekdays: cn('flex', defaultClassNames.weekdays),
        years_dropdown: cn('text-sm', defaultClassNames.years_dropdown),
        ...classNames,
      }}
      components={{
        Chevron: ({ className: iconClassName, orientation, ...iconProps }) =>
          orientation === 'left' ? (
            <ChevronLeftIcon className={cn('size-4', iconClassName)} {...iconProps} />
          ) : (
            <ChevronRightIcon className={cn('size-4', iconClassName)} {...iconProps} />
          ),
      }}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  )
}

export { Calendar }
