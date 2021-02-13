import { CommandHandler } from '../../command-handler';
import { StartingState } from '../state';
import { IdleState } from '../../state'
import { Out } from '../commands';
import { CompositeAction, NewState, Send } from '../actions'
import { BasicMessage } from '../../messages';

export const InHandler = new CommandHandler((state, command) => {
  if (state instanceof StartingState && command.type === Out.type) {
    if (state.interested.some(x => x === command.member.user)) {
      const interested = state.interested.filter(x => x !== command.member.user)
      if (interested.length === 0) {
        return CompositeAction(
          NewState(new IdleState(state.context.guildCtx)),
          Send(state.context.channel, new BasicMessage(`Witty game cancelled`)))
      } else {
        return NewState(new StartingState(state.context, state.interested.filter(x => x !== command.member.user)))
      }
    }
  }
})