import * as Discord from 'discord.js'
import { Command, Begin } from '../commands';
import { Action } from '../actions';
import { GuildContext } from '../context';
import { GameState } from './GameState';
import { tryParseInt, clamp } from '../util';
import { newGame } from './newGame';
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'

/** Default state, no active game */
export class IdleState implements GameState<GuildContext> {
  constructor(readonly context: GuildContext) { }

  readonly interpreter = (message: Discord.Message) => {
    if (message.channel instanceof Discord.TextChannel) {
      if (message.content === "!witty") {
        return Begin(message.author, message.channel, this.context.config.defaultSubmitDurationSec, 3, O.none)
      }

      if (message.content.startsWith("!witty ")) {
        const timeout = pipe(
          / timeout (\d+)\b/.exec(message.content),
          O.fromNullable,
          O.mapNullable(x => tryParseInt(x[1])),
          O.map(x => clamp(x, 10, 120)),
          O.getOrElse(() => this.context.config.defaultSubmitDurationSec)
        )

        const minPlayers = pipe(
          / players (\d+)\b/.exec(message.content),
          O.fromNullable,
          O.mapNullable(x => tryParseInt(x[1])),
          O.map(x => clamp(x, 3, 6)),
          O.getOrElse(() => 3)
        )

        const race = pipe(
          / race (\d+)\b/.exec(message.content),
          O.fromNullable,
          O.mapNullable(x => tryParseInt(x[1])),
          O.map(x => clamp(x, 5, 30))
        )

        return Begin(message.author, message.channel, timeout, minPlayers, race)
      }
    }
  }

  receive(command: Command): Action | undefined {
    if (command.type === 'begin') {
      return newGame(this.context.newGame(command.channel, command.user, command.timeoutSec, command.minPlayers, command.race)) 
    }
  }
}
