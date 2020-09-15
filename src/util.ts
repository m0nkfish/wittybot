import * as Discord from 'discord.js';
export const tryParseInt = (str: string) => {
  try {
    const entry = Number.parseInt(str)
    if (!isNaN(entry)) {
      return entry
    }
  } catch {
  }
  return null
}

export function getOrSet<Key, Value>(map: Map<Key, Value>, key: Key, value: () => Value): Value {
  let res = map.get(key)
  if (!res) {
    res = value()
    map.set(key, res)
  }
  return res
}

export function clamp(x: number, min: number, max: number) {
  return Math.max(min, Math.min(x, max))
}

export function* pairs<T>(array: T[]): Generator<readonly [T, T]> {
  if (array.length < 2) {
    return
  }

  for (let i = 0; i < array.length - 1; i++) {
    for (let j = i + 1; j < array.length; j++) {
      yield [array[i], array[j]] as const
    }
  }
}

export function arrayEq<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) {
    return false
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }

  return true
}

export const invoke = <T>(f: () => T): T => f()
