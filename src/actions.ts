import * as Discord from 'discord.js'
import { Case } from './case'
import { GameState } from './state'
import { Destination, Message } from './messages'

export const Send = Case('send-message', (destination: Destination, message: Message) => ({ destination, message }))
export const NewState = Case('new-state', (newState: GameState) => ({ newState }))
export const CompositeAction = Case('composite-action', (actions: Action[]) => ({ actions }))
export const DelayedAction = Case('delayed-action', (delayMs: number, action: Action) => ({ delayMs, action }))
export const FromStateAction = Case('from-state-action', (getAction: (state: GameState) => Action) => ({ getAction }))
export const AddUserToRole = Case('add-user-to-role', (member: Discord.GuildMember, role: Discord.Role) => ({ member, role }))
export const RemoveUserFromRole = Case('remove-user-from-role', (member: Discord.GuildMember, role: Discord.Role) => ({ member, role }))
export const NullAction = Case('null-action', () => ({}))

export type Action =
  | ReturnType<typeof NewState>
  | ReturnType<typeof NullAction>
  | ReturnType<typeof AddUserToRole>
  | ReturnType<typeof RemoveUserFromRole>
  | ReturnType<typeof Send>
  | Case<'composite-action', { actions: Action[] }>
  | Case<'delayed-action', { delayMs: number, action: Action }>
  | Case<'from-state-action', { getAction: (state: GameState) => Action }>

export const UpdateState = (update: (state: GameState) => GameState) => FromStateAction(state => NewState(update(state)))