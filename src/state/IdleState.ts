import { GuildContext } from '../context';
import { GameState } from './GameState';

/** Default state, no active game */
export class IdleState implements GameState<GuildContext> {
  constructor(readonly context: GuildContext) { }
}
