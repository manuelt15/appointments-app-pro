import type { TranslationKey } from '@/lib/i18n/translate'
import type { ShiftType } from '@/types'

/**
 * Dictionary key for each shift type. The stored value (`shift`, `vacation`,
 * `sick_leave`, `time_off`) never changes: only its on-screen name does.
 */
export const SHIFT_TYPE_KEYS: Record<ShiftType, TranslationKey> = {
  shift: 'shifts.type.shift',
  vacation: 'shifts.type.vacation',
  sick_leave: 'shifts.type.sick_leave',
  time_off: 'shifts.type.time_off',
}

export function shiftTypeKey(type: ShiftType): TranslationKey {
  return SHIFT_TYPE_KEYS[type]
}
