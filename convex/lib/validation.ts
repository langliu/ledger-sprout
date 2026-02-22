import { ConvexError } from 'convex/values'

export function assertIntegerAmount(value: number, field: string) {
  if (!Number.isInteger(value)) {
    throw new ConvexError(`${field} must be an integer`)
  }
}

export function assertPositiveIntegerAmount(value: number, field: string) {
  assertIntegerAmount(value, field)
  if (value <= 0) {
    throw new ConvexError(`${field} must be greater than 0`)
  }
}

export function assertTimestamp(value: number, field: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ConvexError(`${field} must be a valid timestamp`)
  }
}

export function normalizeRequiredName(value: string, field: string) {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    throw new ConvexError(`${field} cannot be empty`)
  }
  return trimmed
}

export function normalizeOptionalNote(value: string | null | undefined) {
  if (value === undefined || value === null) {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}
