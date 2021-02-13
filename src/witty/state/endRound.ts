import { WittyGameContext } from '../context';
import { CompositeAction, NewState, DelayedAction, FromStateAction, OptionalAction, Send } from '../../actions';
import { WaitingState } from './WaitingState';
import { IdleState } from '../../state';
import { newRound } from './newRound';
import { Scores } from '../scores';
import { WinnerMessage } from '../messages';
import { Duration } from '../../duration';

export function endRound(context: WittyGameContext) {

  const top = Scores.fromRounds(context.rounds).mostPoints()

  if (top.points >= context.race) {
    return CompositeAction(
      Send(context.channel, new WinnerMessage(context, top.points, top.users)),
      NewState(new IdleState(context.guildCtx)))
  }

  return CompositeAction(
    NewState(new WaitingState(context)),
    DelayedAction(Duration.seconds(5), FromStateAction(context.guild, state => OptionalAction(state instanceof WaitingState && newRound(context))))
  )
}
