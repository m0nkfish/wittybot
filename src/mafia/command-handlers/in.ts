import { NewState } from '../../actions';
import { CommandHandler, In } from '../../commands';
import { MaxPlayers } from '../constants';
import { StartingState } from '../state';

export const InHandler = () => CommandHandler.build.state(StartingState).command(In).sync((state, command) => {
  if (!state.isInterested(command.member.user) && state.interested.length < MaxPlayers) {
    const nextState = state.addInterested(command.member)
    return NewState(nextState)
  }
})