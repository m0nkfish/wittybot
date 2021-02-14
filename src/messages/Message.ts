import * as Discord from 'discord.js'
import { Command } from '../commands';
import { AnyGameState } from '../state';

export type Destination = Discord.TextChannel | Discord.User

export interface Message {
  content: string | Discord.MessageEmbed | { content: string, embed: Discord.MessageEmbed }
  onSent?: (msg: Discord.Message, getState: () => AnyGameState) => void
  readonly onReact?: (reaction: Discord.MessageReaction, user: Discord.User, member?: Discord.GuildMember) => Command | undefined
}
