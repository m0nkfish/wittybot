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