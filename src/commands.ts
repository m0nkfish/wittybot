import * as Discord from 'discord.js'
import { Case } from './case'

export const Begin = Case('begin', (user: Discord.User, channel: Discord.TextChannel, timeoutSec: number) => ({ channel, user, timeoutSec }))
export const Submit = Case('submit', (submission: string, message: Discord.Message) => ({ user: message.author, submission, message }))
export const Vote = Case('vote', (entry: number, message: Discord.Message) => ({ user: message.author, entry, message }))
export const Skip = Case('skip', () => ({}))
export const GetScores = Case('get-scores', (source: Discord.TextChannel) => ({ source }))
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
