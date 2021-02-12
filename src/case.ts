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
