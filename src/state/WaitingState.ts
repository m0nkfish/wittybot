import { GameState } from '.';
import { GuildContext } from '../context';

export class WaitingState implements GameState<GuildContext> {
  constructor(readonly context: GuildContext) { }
}
