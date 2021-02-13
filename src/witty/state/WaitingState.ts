import { WittyGameContext } from '../context';
import { GameState } from '../../state';

export class WaitingState implements GameState<WittyGameContext> {
  constructor(readonly context: WittyGameContext) { }

  receive = () => undefined
}
