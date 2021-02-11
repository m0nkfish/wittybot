import { GameContext } from '../context';
import { GameState } from './GameState';

export class WaitingState implements GameState<GameContext> {
  constructor(readonly context: GameContext) { }

  interpreter = () => undefined

  receive = () => undefined
}
