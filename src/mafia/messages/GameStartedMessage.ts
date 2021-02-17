import * as Discord from 'discord.js'
import { interval, Observable, combineLatest, concat, of } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators'

import { AnyGameState } from '../../state';
import { StartingState } from '../state/StartingState';
import { Message, mention } from '../../messages'
import { MafiaGameContext } from '../context';
import { Duration } from '../../duration';
import { MinPlayers, StartingStateDelay } from '../constants';

export class GameStartedMessage implements Message {
  constructor(readonly notifyRole: Discord.Role | undefined, readonly context: MafiaGameContext) { }

  readonly inReact = '👍'

  readonly reactable = {
    reacts: [this.inReact]
  }

  get startedBy() { return this.context.initiator }

  get content() {
    const title = `:detective: A game of Mafia has begun!`

    const embed = new Discord.MessageEmbed()
      .setTitle(title)
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
    `A new game was started by ${mention(this.startedBy)}; type \`!in\` or react with ${this.inReact} to join. The game will begin in ${StartingStateDelay.minutes} minutes (${MinPlayers} players minimum)`,
    ``,
    `In:`,
    ...interested.map(x => `• ${mention(x)}`)
  ]

  footer = (remaining: Duration) =>
    remaining.isGreaterThan(Duration.minutes(1))
      ? `${remaining.minutes} minutes remaining`
      : `${remaining.seconds} seconds remaining`

  reactiveMessage = (stateStream?: Observable<AnyGameState>) =>
    combineLatest([stateStream!, interval(5000)])
      .pipe(
        map(([s]) => s),
        takeWhile(s => s instanceof StartingState && s.context.sameGame(this.context) && s.remaining().isGreaterThan(0)),
        map(s => s as StartingState),
        map(s => ({
          description: this.description(s.interested),
          footer: this.footer(s.remaining())
        })),
        o => concat(o, of({ footer: '' }))
      )
  
}