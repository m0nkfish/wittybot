import * as Discord from 'discord.js'
import { Command } from '../commands';
import { AnyGameState } from '../state';
import { Observable } from 'rxjs';

export type Destination = Discord.TextChannel | Discord.User

export interface Message {
  content: string | Discord.MessageEmbed | { content: string, embed: Discord.MessageEmbed }
  reacts?: Discord.EmojiResolvable[]

  onSent?: (msg: Discord.Message, stateStream: Observable<AnyGameState>) => void
  readonly onReact?: (reaction: Discord.MessageReaction, user: Discord.User, member?: Discord.GuildMember) => Command | undefined
}
