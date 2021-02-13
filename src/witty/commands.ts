import * as Discord from 'discord.js'
import { Case } from '../case'
import { Begin, Submit, Skip, Vote, GetScores } from './command-factory';

export const NotifyMe = Case('notify-me', (member: Discord.GuildMember) => ({ member }))
export const UnnotifyMe = Case('unnotify-me', (member: Discord.GuildMember) => ({ member }))
export const Help = Case('help', (source: Discord.User | Discord.TextChannel) => ({ source }))
export const Interested = Case('interested', (member: Discord.GuildMember) => ({ member }))
export const Uninterested = Case('uninterested', (member: Discord.GuildMember) => ({ member }))

export type Command =
  | ReturnType<typeof Begin>
  | ReturnType<typeof Submit>
  | ReturnType<typeof Vote>
  | ReturnType<typeof Skip>
  | ReturnType<typeof GetScores>
  | ReturnType<typeof NotifyMe>
  | ReturnType<typeof UnnotifyMe>
  | ReturnType<typeof Help>
  | ReturnType<typeof Interested>
  | ReturnType<typeof Uninterested>
