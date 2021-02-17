import * as Discord from 'discord.js'
import { interval, Observable, combineLatest, concat, of } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators'

import { AnyGameState } from '../../state';
import { StartingState } from '../state/StartingState';
import { Message, mention, MessageUpdate } from '../../messages'
import { WittyGameContext } from '../context';
import { StartingStateDelay } from '../state/newGame';
import { Duration } from '../../duration';

export class GameStartedMessage implements Message {
  constructor(readonly notifyRole: Discord.Role | undefined, readonly context: WittyGameContext) { }

  readonly inReact = '👍'

  readonly reactable = {
    reacts: [this.inReact]
  }

  get startedBy() { return this.context.initiator }

  get content() {
    const embed = new Discord.MessageEmbed()
      .setTitle(`:person_running: It's a race to ${this.context.race}`)
      .setDescription(this.description([this.startedBy]))
      .setFooter(this.footer(StartingStateDelay))

    return this.notifyRole
      ? {
        content: `Calling all ${mention(this.notifyRole)}! (:point_left: type \`!notify\` if you want to be in this group)`,
        embed
      }
      : embed
  }

  description = (interested: Discord.User[]) => [
    `A new game was started by ${mention(this.startedBy)}; type \`!in\` or react with ${this.inReact} to register interest. The game will begin after ${Math.max(this.context.minPlayers, 5)} people are interested, or after three minutes (whichever comes first)`,
    ``,
    `In:`,
    ...interested.map(x => `• ${mention(x)}`)
  ]

  footer = (remaining: Duration) =>
    remaining.isGreaterThan(Duration.minutes(1))
      ? `${remaining.minutes} minutes remaining`
      : `${remaining.seconds} seconds remaining`

  reactiveMessage = (stateStream?: Observable<AnyGameState>): Observable<MessageUpdate> =>
    combineLatest([stateStream!, interval(5000)])
      .pipe(
        map(([s]) => s),
        takeWhile(s => s instanceof StartingState && s.context.sameGame(this.context) && s.remaining().isGreaterThan(0)),
        map(s => s as StartingState),
        map(s => ({
          footer: this.footer(s.remaining()),
          description: this.description(s.interested)
        })),
        o => concat(o, of({
          footer: ''
        }))
      )
}