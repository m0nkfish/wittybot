import * as Discord from 'discord.js';
import { AnyGameState } from './state/GameState';

export class CommandFactory<C> {
  constructor(public readonly process: (state: AnyGameState, event: Discord.Message) => C | undefined) {}

  combine = <C2>(other: CommandFactory<C2>): CommandFactory<C | C2> => 
    new CommandFactory<C | C2>(
      (state, event) => {
        const c1 = this.process(state, event)
        return c1 !== undefined ? c1 : other.process(state, event)
      }
    )
}
