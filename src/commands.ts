import * as Discord from 'discord.js'
import { Case } from './case'

export const Begin = Case('begin', (user: Discord.User, channel: Discord.TextChannel) => ({ channel, user }))
export const Submit = Case('submit', (user: Discord.User, submission: string) => ({ user, submission }))
export const Vote = Case('vote', (user: Discord.User, entry: number) => ({ user, entry }))
export const Skip = Case('skip', (user: Discord.User, channel: Discord.TextChannel) => ({ channel, user }))
export const GetScores = Case('get-scores', (user: Discord.User, channel: Discord.TextChannel | Discord.DMChannel) => ({ channel, user }))
export const NotifyMe = Case('notify-me', (member: Discord.GuildMember) => ({ member }))
export const UnnotifyMe = Case('unnotify-me', (member: Discord.GuildMember) => ({ member }))
export const Help = Case('help', (user: Discord.User, channel: Discord.TextChannel | Discord.DMChannel) => ({ user, channel }))
export type Command =
  | ReturnType<typeof Begin>
  | ReturnType<typeof Submit>
  | ReturnType<typeof Vote>
  | ReturnType<typeof Skip>
  | ReturnType<typeof GetScores>
  | ReturnType<typeof NotifyMe>
  | ReturnType<typeof UnnotifyMe>
  | ReturnType<typeof Help>
