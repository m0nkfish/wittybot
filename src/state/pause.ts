import { Action, CompositeAction, DelayedAction, FromStateAction, NewState, OptionalAction } from '../actions';
import { GuildContext } from '../context';
import { Duration } from '../duration';
import { WaitingState } from './WaitingState';

export function pause(duration: Duration, context: GuildContext, andThen: () => Action) {
  return CompositeAction(
    NewState(new WaitingState(context)),
    DelayedAction(duration, FromStateAction(context.guild, state => OptionalAction(state instanceof WaitingState && andThen())))
  )
}
