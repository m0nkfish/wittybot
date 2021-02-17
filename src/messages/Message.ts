import * as Discord from 'discord.js'
import { AnyGameState } from '../state';
import { Observable } from 'rxjs';
import { GuildContext } from '../context';

export type Destination = Discord.TextChannel | Discord.User

export interface Message {
  content: string | Discord.MessageEmbed | { content: string, embed: Discord.MessageEmbed }

  context?: GuildContext // context is used to route reactions to the correct guild scope
  reactable?: {
    reacts: Discord.EmojiResolvable[]
  }

  onSent?: (msg: Discord.Message, stateStream: Observable<AnyGameState>) => void

  reactiveMessage?: (stateStream: Observable<AnyGameState> | undefined) => Observable<MessageUpdate>
}

export type MessageUpdate = {
  footer?: string
  description?: string | string[]
  title?: string
}

export const MessageUpdate = {
  equal: (a: MessageUpdate, b: MessageUpdate): boolean =>
    a.title === b.title && a.footer === b.footer && descText(a.description) === descText(b.description)
}

const descText = (desc: string | string[] | undefined) => typeof desc === "string" ? desc : desc === undefined ? '' : desc.join('\n')