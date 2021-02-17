import { Duration } from "./duration"
import { Observable, combineLatest, interval, concat, of } from 'rxjs';
import { startWith, map, tap } from 'rxjs/operators';
import { log, logTap } from './log';

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

const empty = Symbol()
export const memo = <T>(f: () => T): () => T => {
  let res: T | typeof empty = empty
  return () => {
    if (res === empty) {
      res = f()
    }
    return res
  }
}

export type Timer = {
  duration(): Duration
}
export const Timer = {
  begin: beginTimer,
  log(timer: Timer) {
    return ({ duration_ms: timer.duration().milliseconds })
  }
}
export function beginTimer(): Timer {
  const start = process.hrtime()
  return {
    duration() {
      const end = process.hrtime(start)
      return new Duration((end[0] * 1000) + (end[1] / 1000000))
    }
  }
}

export function isNonNull<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export type Constructor<T> = { new(...args: any[]): T }
export function isType<T>(ctor: Constructor<T>) {
  return function (item: any): item is T {
    return item instanceof ctor
  }
}

export function isAny<T>(x: T): x is T {
  return true
}

export type Values<T> = T extends { [key: string]: infer V } ? V : never

export const chain = <A>(...functions: ((a: A) => A)[]) => (a: A) => functions.reduce((a, f) => f(a), a)

const nothing = Symbol()
export const buildScan = <A, Acc>(onFirst: (a: A) => Acc, onNext: (acc: Acc, a: A) => Acc) =>
  (input: Observable<A>) => 
    new Observable<Acc>(sub => {
      let acc: Acc | typeof nothing = nothing
      input.subscribe(
        x => {
          if (acc === nothing) {
            acc = onFirst(x)
          } else {
            acc = onNext(acc, x)
          }
          sub.next(acc)
        },
        e => sub.error(e),
        () => sub.complete()
      )
    })

const immediateInterval = (duration: Duration): Observable<number> =>
  interval(duration.milliseconds)
    .pipe(startWith(0))

export const pulse = <A>(obs: Observable<A>, freq: Duration) =>
  combineLatest([
    obs.pipe(logTap('pulse-input')),
    immediateInterval(freq)])
    .pipe(
      map(([x]) => x),
      logTap('pulse-output'))