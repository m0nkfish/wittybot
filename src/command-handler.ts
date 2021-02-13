import { AnyGameState } from './state';
import { Action } from './witty/actions';
import { Command } from './witty/commands';

export class CommandHandler {
  constructor(public handle: (state: AnyGameState, command: Command) => Promise<Action | undefined>) { }

  orElse = (other: CommandHandler) =>
    new CommandHandler((state, command) => this.handle(state, command) ?? other.handle(state, command))

  static sync = (handle: (state: AnyGameState, command: Command) => Action | undefined) =>
    new CommandHandler(async (s, c) => handle(s, c))
}