import * as Discord from 'discord.js'
import { Case } from './case'

export const Begin = Case('begin', (user: Discord.User, channel: Discord.TextChannel) => ({ channel, user }))
export const Submit = Case('submit', (user: Discord.User, submission: string) => ({ user, submission }))
export const Vote = Case('vote', (user: Discord.User, entry: number) => ({ user, entry }))
export const Skip = Case('skip', (user: Discord.User, channel: Discord.TextChannel) => ({ channel, user }))
export const GetScores = Case('get-scores', (user: Discord.User, channel: Discord.TextChannel | Discord.DMChannel) => ({ channel, user }))
export type Command =
  | ReturnType<typeof Begin>
  | ReturnType<typeof Submit>
  | ReturnType<typeof Vote>
  | ReturnType<typeof Skip>
  | ReturnType<typeof GetScores>
