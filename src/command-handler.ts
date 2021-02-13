import { AnyGameState } from './state';
import { Action } from './witty/actions';
import { Command } from './witty/commands';

export class CommandHandler {
  constructor(public handle: (state: AnyGameState, command: Command) => Action | undefined) { }
}