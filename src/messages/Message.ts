import * as Discord from 'discord.js';
import { MessageEmbed } from 'discord.js';
import { Observable } from 'rxjs';
import { Stream } from 'stream';
import { GuildContext } from '../context';
import { AnyGameState } from '../state';

export type Destination = Discord.TextChannel | Discord.User

type Files = (Discord.FileOptions | Discord.BufferResolvable | Stream | Discord.MessageAttachment)[]
export type EmbedContent =
| Discord.MessageEmbed
| { content: string, embed: Discord.MessageEmbed, files?: Files }
export type MessageContent = string | EmbedContent

type Common = {
  readonly reactable?: {
    reacts: Discord.EmojiResolvable[]
  }
}

export type StaticMessage = Common & {
  type: 'static'
  context?: GuildContext
  content: MessageContent
}

export type StateStreamMessage = Common & {
  type: 'state-stream'
  context: GuildContext
  content$: (stateStream: Observable<AnyGameState>) => Observable<MessageContent>
}

export type Message =
| StaticMessage
| StateStreamMessage

const update = (f: (embed: MessageEmbed) => MessageEmbed) => (content: EmbedContent) =>
  content instanceof Discord.MessageEmbed ? f(content) : { ...content, embed: f(content.embed) }

export const setFooter = (footer: string) =>
  update((embed: MessageEmbed) => embed.setFooter(footer))
export const setDescription = (description: string | string[]) =>
  update((embed: MessageEmbed) => embed.setDescription(description))