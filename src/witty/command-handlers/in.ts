import { CommandHandler, In } from '../../commands';
import { StartingState } from '../state';
import { CompositeAction, NewState, OptionalAction } from '../../actions'

export const InHandler = () => CommandHandler.build.state(StartingState).command(In).sync((state, command) => {
  if (!state.isInterested(command.member.user)) {
    const nextState = state.addInterested(command.member.user)
    return CompositeAction(
      NewState(nextState),
      OptionalAction(nextState.interested.length === Math.max(state.context.minPlayers, 5) && state.begin()))
  }
})