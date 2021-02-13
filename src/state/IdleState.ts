import { Command } from '../witty/commands';
import { Action } from '../witty/actions';
import { GuildContext } from '../context';
import { GameState } from './GameState';
import { AllCommandHandlers } from '../witty/command-handlers';

/** Default state, no active game */
export class IdleState implements GameState<GuildContext> {
  constructor(readonly context: GuildContext) { }

  receive = (command: Command): Action | undefined => AllCommandHandlers.handle(this, command)
}
