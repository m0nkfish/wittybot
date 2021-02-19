import * as Discord from 'discord.js';
import { MessageEmbed } from 'discord.js';
import * as O from 'rxjs';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DiscordEvent, MessageReceived, ReactionAdded, ReactionRemoved } from './discord-events';
import { GuildStates } from './GuildStates';
import { log, loggableError } from "./log";
import { Destination, Message } from "./messages";
import { MessageContent } from './messages/Message';
import { invoke } from './util';

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
              log('reaction-added', { reaction: reaction.emoji.name, user: user.id })
              const fullUser = await msg.client.users.fetch(user.id, true)
              log('reaction-added-user-found', { reaction: reaction.emoji.name, user: user.id })
              this.reactionSubject.next(ReactionAdded(reaction, fullUser, message))
            } catch (err) {
              log.error('error:on-reaction-add', loggableError(err))
            }
          }
        })

        msg.client.on('messageReactionRemove', async (reaction, user) => {
          if (reaction.message.id === msg.id && user !== msg.client.user && reacts.includes(reaction.emoji.name)) {
            try {
              log('reaction-removed', { reaction: reaction.emoji.name, user: user.id })
              const fullUser = await msg.client.users.fetch(user.id, true)
              log('reaction-removed-user-found', { reaction: reaction.emoji.name, user: user.id })
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
