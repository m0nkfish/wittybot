import * as Discord from 'discord.js'
import { Command } from '../witty/commands';
import { Action } from '../witty/actions';
import { GuildContext } from '../context';
import { GameState } from './GameState';
import { newGame } from '../witty/state/newGame';
import { Begin } from '../witty/commands';

/** Default state, no active game */
export class IdleState implements GameState<GuildContext> {
  constructor(readonly context: GuildContext) { }

  receive(command: Command): Action | undefined {
    if (command.type === Begin.type) {
      return newGame(this.context, command.channel, command.user, command.timeoutSec, command.minPlayers, command.race)
    }
  }
}
