import { NewState, Send, toAction } from '../../actions';
import { CommandHandler, Out } from '../../commands';
import { BasicMessage } from '../../messages';
import { IdleState } from '../../state';
import { StartingState } from '../state';

export const OutHandler = () => CommandHandler.build.state(StartingState).command(Out).sync((state, command) =>
  toAction(function* () {
    if (state.isInterested(command.member.user)) {
      const nextState = state.removeInterested(command.member.user)
      if (nextState.interested.length === 0) {
        yield NewState(new IdleState(state.context.guildCtx))
        yield Send(state.context.channel, new BasicMessage(`Mafia game cancelled`))
      } else {
        yield NewState(nextState)
      }
    }
  })
)