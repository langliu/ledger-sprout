"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarClockIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type PickerParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

type DateTimePickerProps = Readonly<{
  value: number | null
  onChange: (nextTimestamp: number) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}>

function pad2(value: number) {
  return String(value).padStart(2, "0")
}

function toRoundedMinuteTimestamp(timestamp: number) {
  return Math.floor(timestamp / 60_000) * 60_000
}

function toParts(timestamp: number | null | undefined): PickerParts {
  const fallback = toRoundedMinuteTimestamp(Date.now())
  const date = new Date(
    timestamp && Number.isFinite(timestamp) && timestamp > 0 ? timestamp : fallback,
  )
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  }
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function toTimestamp(parts: PickerParts) {
  const safeDay = Math.min(parts.day, getDaysInMonth(parts.year, parts.month))
  return new Date(
    parts.year,
    parts.month - 1,
    safeDay,
    parts.hour,
    parts.minute,
    0,
    0,
  ).getTime()
}

function formatDateTime(timestamp: number | null) {
  if (!timestamp || !Number.isFinite(timestamp) || timestamp <= 0) {
    return ""
  }
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(
    date.getHours(),
  )}:${pad2(date.getMinutes())}`
}

function buildNumberOptions(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

export function DateTimePicker({
  value,
  onChange,
  disabled,
  placeholder = "请选择日期和时间",
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const [parts, setParts] = useState<PickerParts>(() => toParts(value))

  useEffect(() => {
    setParts(toParts(value))
  }, [value])

  const years = useMemo(() => {
    return buildNumberOptions(parts.year - 8, parts.year + 8)
  }, [parts.year])
  const months = useMemo(() => buildNumberOptions(1, 12), [])
  const days = useMemo(
    () => buildNumberOptions(1, getDaysInMonth(parts.year, parts.month)),
    [parts.month, parts.year],
  )
  const hours = useMemo(() => buildNumberOptions(0, 23), [])
  const minutes = useMemo(() => buildNumberOptions(0, 59), [])

  const updateParts = (patch: Partial<PickerParts>) => {
    const next = { ...parts, ...patch }
    const maxDay = getDaysInMonth(next.year, next.month)
    if (next.day > maxDay) {
      next.day = maxDay
    }
    setParts(next)
    onChange(toTimestamp(next))
  }

  const setNow = () => {
    onChange(toRoundedMinuteTimestamp(Date.now()))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-between font-normal", className)}
          disabled={disabled}
        >
          <span className={cn(!value ? "text-muted-foreground" : undefined)}>
            {formatDateTime(value) || placeholder}
          </span>
          <CalendarClockIcon className="size-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[340px] space-y-3 p-3">
        <div className="grid grid-cols-3 gap-2">
          <Select
            value={String(parts.year)}
            onValueChange={(nextValue) => {
              updateParts({ year: Number.parseInt(nextValue, 10) })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="年" />
            </SelectTrigger>
            <SelectContent>
              {years.map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {item} 年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(parts.month)}
            onValueChange={(nextValue) => {
              updateParts({ month: Number.parseInt(nextValue, 10) })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="月" />
            </SelectTrigger>
            <SelectContent>
              {months.map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {item} 月
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(parts.day)}
            onValueChange={(nextValue) => {
              updateParts({ day: Number.parseInt(nextValue, 10) })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="日" />
            </SelectTrigger>
            <SelectContent>
              {days.map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {item} 日
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={String(parts.hour)}
            onValueChange={(nextValue) => {
              updateParts({ hour: Number.parseInt(nextValue, 10) })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="时" />
            </SelectTrigger>
            <SelectContent>
              {hours.map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {pad2(item)} 时
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(parts.minute)}
            onValueChange={(nextValue) => {
              updateParts({ minute: Number.parseInt(nextValue, 10) })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="分" />
            </SelectTrigger>
            <SelectContent>
              {minutes.map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {pad2(item)} 分
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={setNow}>
            设为当前时间
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            完成
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
