import * as Discord from 'discord.js'
import { Case } from './case'
import { AnyGameState } from './state';
import { Destination, Message } from './messages'

export const Send = Case('send-message', (destination: Destination, message: Message) => ({ destination, message }))
export const NewState = Case('new-state', (newState: AnyGameState) => ({ newState }))
export const CompositeAction = Case('composite-action', (...actions: Action[]) => ({ actions }))
export const PromiseAction = Case('promise-action', (promise: Promise<Action>) => ({ promise }))
export const FromStateAction = Case('from-state-action', (getAction: (state: AnyGameState) => Action) => ({ getAction }))
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
  | Case<'from-state-action', { getAction: (state: AnyGameState) => Action }>
  | Case<'promise-action', { promise: Promise<Action> }>

export const UpdateState = (update: (state: AnyGameState) => AnyGameState) => FromStateAction(state => NewState(update(state)))
export const DelayedAction = (delayMs: number, action: Action) => PromiseAction(new Promise<Action>(resolve => setTimeout(() => resolve(action), delayMs)))