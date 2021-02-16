export type Case<Key extends string, Res> = Res & { type: Key }
export const Case = <Key extends string, Args extends any[], Res>(type: Key, f: (...args: Args) => Res) => {
  function ff(...args: Args) {
    return {
      ...f(...args),
      type
    }
  }
  ff.type = type
  return ff
}

export type CaseFactory<C> =
  C extends { type: infer K } ? K extends string ? ((...args: any) => Case<K, C>) & { type: K } : never : never

export function isCase<C extends { type: string }>(type: CaseFactory<C>) {
  return function (command: { type: string }): command is C {
    return command.type === type.type
  }
}