type Loggable = {
  [key: string]: string | number | boolean | undefined | null
} | undefined | null

export function log(event: string, ...loggables: Loggable[]) {
  console.log(makeString(event, loggables))
}
log.trace = function (event: string, ...loggables: Loggable[]) {
  console.trace(makeString(event, loggables))
}
log.debug = function (event: string, ...loggables: Loggable[]) {
  console.debug(makeString(event, loggables))
}
log.info = function (event: string, ...loggables: Loggable[]) {
  console.info(makeString(event, loggables))
}
log.warn = function (event: string, ...loggables: Loggable[]) {
  console.warn(makeString(event, loggables))
}
log.error = function(event: string, ...loggables: Loggable[]) {
  console.error(makeString(event, loggables))
}

function makeString(event: string, loggables: Loggable[]) {
  try {
    return Object.entries(Object.fromEntries(getPairs([{ event }, ...loggables])))
      .map((([k, v]) => `${k}=${v}`))
      .join(' ')
  } catch {
    return '(error in loggable handler)'
  }
}

function* getPairs(loggables: Loggable[]) {
  for (const l of loggables) {
    if (l) {
      for (const [k, v] of Object.entries(l)) {
        if (v !== undefined && v !== null && v !== "") {
          yield [k, v] as const
        }
      }
    }
  }
}

export function loggableError(err: any) {
  return err instanceof Error ? { name: err.name, message: err.message } : null
}