import { Action, NewState, CompositeAction, Send, PromiseAction, OptionalAction, DelayedAction, FromStateAction } from '../actions';
import { GameContext } from '../context';
import { getNotifyRole } from '../notify';
import { GameStartedMessage, BasicMessage } from '../messages';
import { IdleState } from './IdleState';
import { StartingState } from './StartingState';

export function newGame(context: GameContext): Action {
  const gameStartedMessage = getNotifyRole(context.channel.guild)
    .then(role => Send(context.channel, new GameStartedMessage(role, context.initiator, context)))

  const timeout =
    FromStateAction(context.channel.guild, state =>
      OptionalAction(state instanceof StartingState && state.context.gameId.eq(context.gameId) &&
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