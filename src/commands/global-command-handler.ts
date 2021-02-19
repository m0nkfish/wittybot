import { Action } from '../actions';
import { Command } from './command';

export class GlobalCommandHandler {
  constructor(readonly handle: (command: Command) => Promise<Action | undefined>) { }

  orElse = (other: GlobalCommandHandler) =>
    new GlobalCommandHandler(async cmd => (await this.handle(cmd)) ?? other.handle(cmd))
}