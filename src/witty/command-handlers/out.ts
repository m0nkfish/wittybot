import { CommandHandler } from '../../command-handler';
import { StartingState } from '../state';
import { IdleState } from '../../state'
import { Out } from '../commands';
import { CompositeAction, NewState, Send } from '../actions'
import { BasicMessage } from '../../messages';
import { log } from '../../log';

export const OutHandler = CommandHandler.sync((state, command) => {
  if (state instanceof StartingState && command.type === Out.type && state.isInterested(command.member.user)) {
    log('out_handler');
    const nextState = state.removeInterested(command.member.user)
    return nextState.interested.length === 0
      ? CompositeAction(
          NewState(new IdleState(state.context.guildCtx)),
          Send(state.context.channel, new BasicMessage(`Witty game cancelled`)))
      : NewState(nextState)
  }
})