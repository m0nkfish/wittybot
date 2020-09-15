type Loggable = {
  [key: string]: string | boolean | undefined | null
} | undefined | null

export function log(event: string, ...loggables: Loggable[]) {
  const str = Array.from(getPairs([{ event }, ...loggables]))
    .map((([k, v]) => `${k}=${v}`))
    .join(' ')

  console.log(str)
}

function* getPairs(loggables: Loggable[]) {
  for (const l of loggables) {
    if (l) {
      for (const [k, v] of Object.entries(l)) {
        if (v !== undefined && v !== null) {
          yield [k, v] as const
        }
      }
    }
  }
}