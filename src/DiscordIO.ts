import * as Discord from 'discord.js';
import { Observable } from 'rxjs'
import * as O from 'rxjs'
import { filter, map, tap } from 'rxjs/operators'
import { Message, Destination } from "./messages";
import { log, loggableError } from "./log";
import { GuildStates } from './GuildStates';
import { Subject } from 'rxjs';
import { DiscordEvent, MessageReceived, ReactionAdded, ReactionRemoved } from './discord-events';
import { invoke } from './util';
import { MessageContent } from './messages/Message';
import { MessageEmbed } from 'discord.js';

export class DiscordIO {

  private readonly reactionSubject = new Subject<DiscordEvent>()
  readonly eventStream: Observable<DiscordEvent>;

  constructor(readonly guilds: GuildStates, readonly client: Discord.Client) {
    const messageStream =
      O.fromEvent<Discord.Message>(client, 'message')
        .pipe(
          filter(m => !m.author.bot),
          map(MessageReceived))

    this.eventStream = O.merge(this.reactionSubject, messageStream)
  }

  send = (destination: Destination, message: Message) => {
    const messageStates$ = message.type === 'static'
      ? O.of(message.content)
      : invoke(() => {
        const guild = message.context.guild
        const stateStream = this.guilds.getStream(guild)
        return message.content$(stateStream)
      })

    const send = async (content: MessageContent) => {
      const embedColor = '#A4218A'
      if (content instanceof Discord.MessageEmbed) {
        content.setColor(embedColor)
      } else if (typeof content !== "string") {
        content.embed.setColor(embedColor)
      }

      const msg = await destination.send(content)

      if (message.reactable) {
        const { reacts } = message.reactable
        if (reacts) {
          try {
            await reacts
              .reduce((res, emoji) => res.then(async () => { await msg.react(emoji) }), Promise.resolve())
          } catch (err) {
            log.error('message:add-reactions', loggableError(err))
          }
        }

        msg.client.on('messageReactionAdd', async (reaction, user) => {
          if (reaction.message.id === msg.id && user !== msg.client.user && reacts.includes(reaction.emoji.name)) {
            try {
              const fullUser = await msg.client.users.fetch(user.id, true)
              this.reactionSubject.next(ReactionAdded(reaction, fullUser, message))
            } catch (err) {
              log.error('error:on-reaction-add', loggableError(err))
            }
          }
        })

        msg.client.on('messageReactionRemove', async (reaction, user) => {
          if (reaction.message.id === msg.id && user !== msg.client.user && reacts.includes(reaction.emoji.name)) {
            try {
              const fullUser = await msg.client.users.fetch(user.id, true)
              this.reactionSubject.next(ReactionRemoved(reaction, fullUser, message))
            } catch (err) {
              log.error('error:on-reaction-remove', loggableError(err))
            }
          }
        })
      }

      return msg
    }

    let msg: Promise<Discord.Message> | null = null
    messageStates$
      .subscribe(x => {
        if (msg === null) {
          msg = send(x)
        } else {
          const edit = x instanceof MessageEmbed ? { embed: x } : x
          msg = msg.then(m => m.edit(edit))
        }
      })
  }
}
