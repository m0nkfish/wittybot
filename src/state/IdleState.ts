import * as Discord from 'discord.js'
import { Command } from '../witty/commands';
import { Action } from '../witty/actions';
import { GuildContext } from '../context';
import { GameState } from './GameState';
import { newGame } from '../witty/state/newGame';
import { Begin, BeginFactory } from '../witty/command-factory';

/** Default state, no active game */
export class IdleState implements GameState<GuildContext> {
  constructor(readonly context: GuildContext) { }

  readonly interpreter = (message: Discord.Message): Command | undefined => {
    return BeginFactory.process(this, message)
  }

  receive(command: Command): Action | undefined {
    if (command.type === Begin.type) {
      return newGame(this.context.newWittyGame(command.channel, command.user, command.timeoutSec, command.minPlayers, command.race)) 
    }
  }
}
