import * as Discord from 'discord.js';
import { concat, Observable } from 'rxjs';
import { map, scan, skipWhile, take, takeWhile } from 'rxjs/operators';
import { Duration } from '../../duration';
import { EmbedContent, Emojis, mention, MessageContent, setDescription, setFooter, StateStreamMessage } from '../../messages';
import { AnyGameState, IdleState } from '../../state';
import { chain, isType, pulse } from '../../util';
import { StartingStateDelay } from '../constants';
import { MafiaGameContext } from '../context';
import { StartingState } from '../state';

export class GameStartedMessage implements StateStreamMessage {
  readonly type = 'state-stream'

  constructor(readonly context: MafiaGameContext) { }

  readonly inReact = Emojis.detective

  readonly reactable = {
    reacts: [this.inReact]
  }

  get startedBy() { return this.context.initiator }

  get content(): EmbedContent {
    return new Discord.MessageEmbed()
      .setTitle(`:detective: A game of Mafia has begun!`)
      .setDescription(this.description([this.startedBy]))
      .setFooter(this.footer(StartingStateDelay))
  }

  description = (interested: Discord.User[]) => [
    `A new game was started by ${mention(this.startedBy)}; type \`!in\` or react with ${this.inReact} to join. The game will begin in ${StartingStateDelay.minutes} minutes`,
    ``,
    `Minimum players: ${this.context.settings.minPlayers}`,
    `Role reveals on death: ${this.context.settings.reveals ? "on " : "off"}`,
    ``,
    `In:`,
    ...interested.map(x => `• ${mention(x)}`)
  ]

  footer = (remaining: Duration) =>
    remaining.isGreaterThan(Duration.minutes(1))
      ? `${remaining.minutes} minutes remaining`
      : `${remaining.seconds} seconds remaining`

  content$ = (stateStream$: Observable<AnyGameState>): Observable<MessageContent> => {
    const startingState$ = pulse(stateStream$, Duration.seconds(5))
      .pipe(
        takeWhile(isType(StartingState)),
        map(s => chain(
          setFooter(this.footer(s.remaining())),
          setDescription(this.description(s.interested))
        )))

    const subsequentState$ = stateStream$
      .pipe(
        skipWhile(isType(StartingState)),
        take(1),
        map(s => setFooter(s instanceof IdleState ? 'The game has been cancelled' : 'The game has begun!'))
      )

    return concat(startingState$, subsequentState$)
      .pipe(scan((content, update) => update(content), this.content))
  }
}