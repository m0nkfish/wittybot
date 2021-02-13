export type AnyGameState = GameState<any>

export type GameState<Context> = {
  readonly context: Context
}
