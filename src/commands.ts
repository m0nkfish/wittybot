import * as Discord from 'discord.js'
import { Case } from './case'

export const Begin = Case('begin', (user: Discord.User, channel: Discord.TextChannel, timeoutSec: number) => ({ channel, user, timeoutSec }))
export const Submit = Case('submit', (user: Discord.User, submission: string) => ({ user, submission }))
export const Vote = Case('vote', (user: Discord.User, entry: number) => ({ user, entry }))
export const Skip = Case('skip', () => ({}))
export const GetScores = Case('get-scores', (source: Discord.User | Discord.TextChannel) => ({ source }))
export const NotifyMe = Case('notify-me', (member: Discord.GuildMember) => ({ member }))
export const UnnotifyMe = Case('unnotify-me', (member: Discord.GuildMember) => ({ member }))
export const Help = Case('help', (source: Discord.User | Discord.TextChannel) => ({ source }))

export type Command =
  | ReturnType<typeof Begin>
  | ReturnType<typeof Submit>
  | ReturnType<typeof Vote>
  | ReturnType<typeof Skip>
  | ReturnType<typeof GetScores>
  | ReturnType<typeof NotifyMe>
  | ReturnType<typeof UnnotifyMe>
  | ReturnType<typeof Help>
