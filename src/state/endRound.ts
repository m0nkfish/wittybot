import { GameContext } from '../context';
import { CompositeAction, NewState, DelayedAction, FromStateAction, OptionalAction } from '../actions';
import { WaitingState } from './WaitingState';
import { IdleState } from './IdleState';
import { newRound } from './newRound';

export function endRound(context: GameContext) {
  return CompositeAction(
    NewState(new WaitingState(context)),
    DelayedAction(5000, FromStateAction(context.guild, state => OptionalAction(state instanceof WaitingState && newRound(context))))
  )
}
