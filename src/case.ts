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

export type CaseFactory<Key extends string, C extends { type: string }> = ((...args: any) => Case<Key, C>) & { type: Key }
export function isCase<Key extends string, C extends { type: string }>(type: CaseFactory<Key, C>) {
  return function (command: { type: string }): command is C {
    return command.type === type.type
  }
}