import * as Discord from 'discord.js';
import { Observable } from 'rxjs'
import * as O from 'rxjs'
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators'
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

    if (message.reactiveMessage) {
      const guild = message.context?.guild
      const stateStream = guild && this.guilds.getStream(guild)
      message.reactiveMessage(stateStream)
        .pipe(
          distinctUntilChanged(MessageUpdate.equal),
        )
        .subscribe(updates => {
          const content = message.content // recreate the embed
          if (content instanceof Discord.MessageEmbed) {
            content.setColor(embedColor)
              .setDescription(updates.description ?? content.description)
              .setFooter(updates.footer ?? content.footer)
              .setTitle(updates.title ?? content.title)
          } else if (typeof content !== "string") {
            content.embed.setColor(embedColor)
              .setDescription(updates.description ?? content.embed.description)
              .setFooter(updates.footer ?? content.embed.footer)
              .setTitle(updates.title ?? content.embed.title)
          }

          log.debug('reactive-msg-edit', { embeds: msg.embeds.length })
          msg.edit(content)
            .catch(e => log.error('reactive-msg-error', loggableError(e)))
        })
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