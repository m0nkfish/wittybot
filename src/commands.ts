import * as Discord from 'discord.js'
import { Case } from './case'

export const Begin = Case('begin', (user: Discord.User, channel: Discord.TextChannel) => ({ channel, user }))
export const Submit = Case('submit', (user: Discord.User, submission: string) => ({ user, submission }))
export const Vote = Case('vote', (user: Discord.User, entry: number) => ({ user, entry }))
export type Command =
  | ReturnType<typeof Begin>
  | ReturnType<typeof Submit>
  | ReturnType<typeof Vote>