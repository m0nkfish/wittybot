import { AnyGameState } from './state';
import { Action } from './witty/actions';
import { Command } from './witty/commands';

export class CommandHandler {
  constructor(public handle: (state: AnyGameState, command: Command) => Action | undefined) { }

  orElse = (other: CommandHandler) =>
    new CommandHandler((state, command) => this.handle(state, command) ?? other.handle(state, command))
}