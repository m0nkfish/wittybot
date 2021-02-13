import { CommandHandler } from '../../command-handler';
import { StartingState } from '../state';
import { In } from '../commands';
import { CompositeAction, NewState, OptionalAction } from '../actions'

export const InHandler = new CommandHandler((state, command) => {
  if (state instanceof StartingState && command.type === In.type && !state.isInterested(command.member.user)) {
    const nextState = state.addInterested(command.member.user)
    return CompositeAction(
      NewState(nextState),
      OptionalAction(nextState.interested.length === Math.max(state.context.minPlayers, 5) && state.begin()))
  }
})