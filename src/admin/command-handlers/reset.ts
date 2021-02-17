import { CommandHandler } from '../../commands';
import { Reset } from '../commands';
import { CompositeAction, Send, NewState } from '../../actions';
import { BasicMessage } from '../../messages';
import { IdleState } from '../../state/IdleState';

export const ResetHandler = () => CommandHandler.build.command(Reset).sync((state, {member}) =>
  state instanceof IdleState
  ? Send(member.user, new BasicMessage(`State is already idle for ${member.guild.name}`))
  : CompositeAction(
    Send(member.user, new BasicMessage(`State reset for ${member.guild.name}`)),
    NewState(new IdleState(state.context))
  )
)