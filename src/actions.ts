import * as Discord from 'discord.js'
import { Case } from './case'
import { GameState } from './state'

export const Message = Case('post-message', (channel: Discord.TextChannel | Discord.DMChannel, message: string) => ({ channel, message }))
export const EmbedMessage = Case('embed-message', (channel: Discord.TextChannel | Discord.DMChannel, embed: Discord.MessageEmbed) => ({ channel, embed }))
export const NewState = Case('new-state', (newState: GameState) => ({ newState }))
export const CompositeAction = Case('composite-action', (actions: Action[]) => ({ actions }))
export const DelayedAction = Case('delayed-action', (delayMs: number, action: Action) => ({ delayMs, action }))
export const FromStateAction = Case('from-state-action', (getAction: (state: GameState) => Action) => ({ getAction }))
export const NullAction = Case('null-action', () => ({}))

export type Action =
  | ReturnType<typeof Message>
  | ReturnType<typeof EmbedMessage>
  | ReturnType<typeof NewState>
  | ReturnType<typeof NullAction>
  | Case<'composite-action', { actions: Action[] }>
  | Case<'delayed-action', { delayMs: number, action: Action }>
  | Case<'from-state-action', { getAction: (state: GameState) => Action }>

export const UpdateState = (update: (state: GameState) => GameState) => FromStateAction(state => NewState(update(state)))