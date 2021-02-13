import { CommandHandler } from '../../command-handler';
import { StartingState } from '../state';
import { IdleState } from '../../state'
import { Out } from '../commands';
import { CompositeAction, NewState, Send } from '../../actions'
import { BasicMessage } from '../../messages';

export const OutHandler = CommandHandler.build.state(StartingState).command(Out).sync((state, command) => {
  if (state.isInterested(command.member.user)) {
    const nextState = state.removeInterested(command.member.user)
    return nextState.interested.length === 0
      ? CompositeAction(
          NewState(new IdleState(state.context.guildCtx)),
          Send(state.context.channel, new BasicMessage(`Witty game cancelled`)))
      : NewState(nextState)
  }
})