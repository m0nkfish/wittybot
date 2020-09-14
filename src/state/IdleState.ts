import * as Discord from 'discord.js'
import { Command, Begin } from '../commands';
import { Action } from '../actions';
import { GuildContext } from '../context';
import { GameState } from './GameState';
import { tryParseInt, clamp } from '../util';
import { StartingState } from './StartingState';

/** Default state, no active game */
export class IdleState implements GameState<GuildContext> {
  constructor(readonly context: GuildContext) { }

  readonly interpreter = (message: Discord.Message) => {
    if (message.channel instanceof Discord.TextChannel) {
      const parsed = /^!witty(?: (\d+))?$/.exec(message.content)
      if (parsed) {
        const timeout = clamp(tryParseInt(parsed[1]) ?? this.context.config.defaultSubmitDurationSec, 10, 120)
        return Begin(message.author, message.channel, timeout)
      }
    }
  }

  receive(command: Command): Action | undefined {
    if (command.type === 'begin') {
      return StartingState.begin(this.context.newGame(command.channel, command.user, command.timeoutSec)) 
    }
  }
}
