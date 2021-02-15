import { Message, Destination } from "./messages";
import * as Discord from 'discord.js';
import { log, loggableError } from "./log";
import { GuildStates } from './GuildStates';
import { Subject } from 'rxjs';
import { DiscordEvent, ReactionAdded, ReactionRemoved } from './discord-events';

export class DiscordIO {

  private readonly reactionSubject = new Subject<DiscordEvent>()
  readonly reactionStream = this.reactionSubject.asObservable()

  constructor(readonly guilds: GuildStates) {}

  send = async (destination: Destination, message: Message) => {
    const embedColor = '#A4218A'
    const content = message.content
    if (content instanceof Discord.MessageEmbed) {
      content.setColor(embedColor)
    } else if (typeof content !== "string") {
      content.embed.setColor(embedColor)
    }
    const msg = await destination.send(content)

    const { guild } = msg
    if (guild) {
      message.onSent?.(msg, this.guilds.getStream(guild))
    }

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
        if (reaction.message.id === msg.id && user !== msg.client.user) {
          try {
            const fullUser = await msg.client.users.fetch(user.id, true)
            this.reactionSubject.next(ReactionAdded(reaction, fullUser, message))
          } catch (err) {
            log.error('error:on-reaction-add', loggableError(err))
          }
        }
      })

      msg.client.on('messageReactionRemove', async (reaction, user) => {
        if (reaction.message.id === msg.id && user !== msg.client.user) {
          try {
            const fullUser = await msg.client.users.fetch(user.id, true)
            this.reactionSubject.next(ReactionRemoved(reaction, fullUser, message))
          } catch (err) {
            log.error('error:on-reaction-remove', loggableError(err))
          }
        }
      })
    }
  }
}