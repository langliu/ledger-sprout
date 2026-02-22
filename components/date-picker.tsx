'use client'

import { CalendarIcon } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type DatePickerProps = Readonly<{
  value: string
  onChange: (nextValue: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}>

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function parseDateValue(value: string): Date | null {
  if (!value) {
    return null
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return null
  }
  const year = Number.parseInt(match[1], 10)
  const month = Number.parseInt(match[2], 10)
  const day = Number.parseInt(match[3], 10)
  const date = new Date(year, month - 1, day)
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

function toDateValue(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function formatDisplay(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function DatePicker({
  value,
  onChange,
  disabled,
  placeholder = '请选择日期',
  className,
}: DatePickerProps) {
  const selected = useMemo(() => parseDateValue(value) ?? undefined, [value])
  const currentYear = new Date().getFullYear()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            'w-full justify-start text-left font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
          disabled={disabled}
          type='button'
          variant='outline'
        >
          <CalendarIcon className='mr-2 size-4' />
          {selected ? formatDisplay(selected) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-auto overflow-hidden p-0'>
        <Calendar
          captionLayout='dropdown'
          endMonth={new Date(currentYear + 8, 11)}
          mode='single'
          onSelect={(date) => {
            onChange(date ? toDateValue(date) : '')
          }}
          selected={selected}
          startMonth={new Date(currentYear - 8, 0)}
        />
      </PopoverContent>
    </Popover>
  )
}
