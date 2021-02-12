import * as Discord from 'discord.js'
import { AnyGameState } from '../state';

export type Destination = Discord.TextChannel | Discord.User

export interface Message {
  content: string | Discord.MessageEmbed | { content: string, embed: Discord.MessageEmbed }
  onSent?: (msg: Discord.Message, getState: () => AnyGameState) => void
}
