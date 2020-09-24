import * as O from 'fp-ts/Option'

import { GameContext } from '../context';
import { CompositeAction, NewState, DelayedAction, FromStateAction, OptionalAction, Send } from '../actions';
import { WaitingState } from './WaitingState';
import { IdleState } from './IdleState';
import { newRound } from './newRound';
import { Scores } from '../scores';
import { WinnerMessage } from '../messages';

export function endRound(context: GameContext) {

  const top = Scores.fromRounds(context.rounds).mostPoints()

  if (O.isSome(context.race) && top.points >= context.race.value) {
    return CompositeAction(
      Send(context.channel, new WinnerMessage(context, top.points, top.users)),
      NewState(new IdleState(context.guildCtx)))
  }

  return CompositeAction(
    NewState(new WaitingState(context)),
    DelayedAction(5000, FromStateAction(context.guild, state => OptionalAction(state instanceof WaitingState && newRound(context))))
  )
}
