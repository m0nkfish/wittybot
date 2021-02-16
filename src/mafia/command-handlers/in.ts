import { CommandHandler, In } from '../../commands';
import { StartingState } from '../state';
import { NewState } from '../../actions'
import { MaxPlayers } from '../constants';

export const InHandler = () => CommandHandler.build.state(StartingState).command(In).sync((state, command) => {
  if (!state.isInterested(command.member.user) && state.interested.length < MaxPlayers) {
    const nextState = state.addInterested(command.member.user)
    return NewState(nextState)
  }
})