import { CompositeAction, NewState, Send } from '../../actions';
import { Duration } from '../../duration';
import { IdleState, pause } from '../../state';
import { WittyGameContext } from '../context';
import { WinnerMessage } from '../messages';
import { Scores } from '../scores';
import { newRound } from './newRound';

export function endRound(context: WittyGameContext) {

  const top = Scores.fromRounds(context.rounds).mostPoints()

  if (top.points >= context.race) {
    return CompositeAction(
      Send(context.channel, new WinnerMessage(context, top.points, top.users)),
      NewState(new IdleState(context.guildCtx)))
  }

  return pause(Duration.seconds(5), context, () => newRound(context))
}
