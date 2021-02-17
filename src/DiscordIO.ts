import * as Discord from 'discord.js';
import { Observable } from 'rxjs'
import * as O from 'rxjs'
import { distinctUntilChanged, filter, map } from 'rxjs/operators'
import { Message, Destination, MessageUpdate } from "./messages";
import { log, loggableError } from "./log";
import { GuildStates } from './GuildStates';
import { Subject } from 'rxjs';
import { DiscordEvent, MessageReceived, ReactionAdded, ReactionRemoved } from './discord-events';
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

  send = async (destination: Destination, message: Message) => {
    const embedColor = '#A4218A'
    const content = message.content
    if (content instanceof Discord.MessageEmbed) {
      content.setColor(embedColor)
    } else if (typeof content !== "string") {
      content.embed.setColor(embedColor)
    }
    const msg = await destination.send(content)

    function update(embed: MessageEmbed, partial: MessageUpdate) {
      if (partial.description !== undefined) {
        embed = embed.setDescription(partial.description)
      }
      if (partial.footer !== undefined) {
        embed = embed.setFooter(partial.footer)
      }
      return embed
    }

    if (message.reactiveMessage) {
      const guild = message.context?.guild
      const stateStream = guild && this.guilds.getStream(guild)
      message.reactiveMessage(stateStream)
        .pipe(distinctUntilChanged(MessageUpdate.equal))
        .subscribe(updates => {
          msg.edit({ embeds: update(msg.embeds[0], updates) })
        })
    }

    const guild = message.context?.guild
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
  }
}