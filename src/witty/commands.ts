import * as Discord from 'discord.js'
import { Case } from '../case'
import { Begin, Submit, Skip, Vote, GetScores, In, Out, Notify, Unnotify } from './command-factory';

export const Help = Case('help', (source: Discord.User | Discord.TextChannel) => ({ source }))

export type Command =
  | ReturnType<typeof Begin>
  | ReturnType<typeof Submit>
  | ReturnType<typeof Vote>
  | ReturnType<typeof Skip>
  | ReturnType<typeof GetScores>
  | ReturnType<typeof Notify>
  | ReturnType<typeof Unnotify>
  | ReturnType<typeof Help>
  | ReturnType<typeof In>
  | ReturnType<typeof Out>
