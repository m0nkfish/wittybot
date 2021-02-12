import { Action, NewState, CompositeAction, Send, PromiseAction, OptionalAction, DelayedAction, FromStateAction } from '../actions';
import { WittyGameContext } from '../context';
import { getNotifyRole } from '../notify';
import { GameStartedMessage } from '../messages';
import { BasicMessage } from '../../messages';
import { IdleState } from './../../state';
import { StartingState } from './StartingState';

export function newGame(context: WittyGameContext): Action {
  const gameStartedMessage = getNotifyRole(context.channel.guild)
    .then(role => Send(context.channel, new GameStartedMessage(role, context)))

  const timeout =
    FromStateAction(context.channel.guild, state =>
      OptionalAction(state instanceof StartingState && state.context.sameGame(context) &&
        (state.enoughInterest()
        ? state.begin()
        : CompositeAction(
            Send(context.channel, new BasicMessage(`Not enough players to begin the game`)),
            NewState(new IdleState(context.guildCtx))
          )
        )
      )
    )

  return CompositeAction(
    PromiseAction(gameStartedMessage),
    DelayedAction(StartingStateDelayMs, timeout),
    NewState(new StartingState(context, [context.initiator])),
  )
}

export const StartingStateDelayMs = 1000 * 60 * 3