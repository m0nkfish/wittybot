import * as Discord from 'discord.js';
import { MessageEmbed } from 'discord.js';
import * as O from 'rxjs';
import { Observable, Subject } from 'rxjs';
import { concatMap, filter, map, mergeMap, multicast } from 'rxjs/operators';
import { DiscordEvent, MessageReceived, ReactionAdded, ReactionRemoved } from './discord-events';
import { GuildStates } from './GuildStates';
import { log, loggableError } from './log';
import { Destination, Message } from "./messages";
import { MessageContent } from './messages/Message';
import { invoke } from './util';

type SentMessage = {
  sent: Discord.Message
  source: Message
}

export class DiscordIO {

  readonly eventStream: Observable<DiscordEvent>;
  private readonly sentMessages = new Subject<SentMessage>()

  constructor(readonly guilds: GuildStates, readonly client: Discord.Client) {
    const messageStream =
      O.fromEvent<Discord.Message>(client, 'message')
        .pipe(
          filter(m => m.author !== client.user && !m.author.bot),
          map(MessageReceived))

    const connectable$ = O.merge(
      discordEventObs(client, 'messageReactionAdd')
        .pipe(map(e => [...e, ReactionAdded] as const)),
      discordEventObs(client, 'messageReactionRemove')
        .pipe(map(e => [...e, ReactionRemoved] as const))
    ).pipe(
      filter(([_, u]) => u !== client.user), // ignore reactions from wittybot!
      multicast(new Subject())
    ) as O.ConnectableObservable<[Discord.MessageReaction, Discord.User | Discord.PartialUser, typeof ReactionAdded | typeof ReactionRemoved]>

    connectable$.connect()

    const reactsWithUser$ = connectable$.pipe(
      concatMap(([reaction, user, ctor]) => client.users.fetch(user.id, true).then(user => [reaction, user, ctor] as const)),
    )

    const reactionEvents$ = this.sentMessages.pipe(
      filter(x => !!x.source.reactable),
      mergeMap(({sent, source}) => reactsWithUser$.pipe(
        filter(([reaction]) => reaction.message.id === sent.id && source.reactable!.reacts.includes(reaction.emoji.name)),
        map(([reaction, user, ctor]) => ctor(reaction, user, source)))))

    connectable$.subscribe(([r, u, t]) => log('react-received', { emoji: r.emoji.name, user: u.username ?? 'partial', type: t.type }))
    connectable$.subscribe(([r, u, t]) => log('react-received-user-fetched', { emoji: r.emoji.name, user: u.username, type: t.type }))
        
    this.eventStream = O.merge(reactionEvents$, messageStream)
  }

  send = (destination: Destination, source: Message) => {
    const messageStates$ = source.type === 'static'
      ? O.of(source.content)
      : invoke(() => {
        const guild = source.context.guild
        const stateStream = this.guilds.getStream(guild)
        return source.content$(stateStream)
      })

    const send = async (content: MessageContent) => {
      const embedColor = '#A4218A'
      if (content instanceof Discord.MessageEmbed) {
        content.setColor(embedColor)
      } else if (typeof content !== "string") {
        content.embed.setColor(embedColor)
      }

      const sent = await destination.send(content)

      this.sentMessages.next({sent, source})

      if (source.reactable) {
        try {
          for (const r of source.reactable.reacts) {
            await sent.react(r)
          }
        } catch (err) {
          log.error('message:add-reactions', loggableError(err))
        }
      }

      return sent
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

export function discordEventObs<T, K extends keyof Discord.ClientEvents>(client: Discord.Client, eventName: K): Observable<Discord.ClientEvents[K]> {
  return new Observable<Discord.ClientEvents[K]>(subscribe => {
    const handler = (...args: Discord.ClientEvents[K]) => {
      subscribe.next(args)
    }
    client.on(eventName, handler)
    return () => {
      client.off(eventName, handler)
    }
  })
}
