import { CommandHandler } from '../../command-handler';
import { StartingState } from '../state';
import { In } from '../commands';
import { CompositeAction, NewState, OptionalAction } from '../actions'

export const InHandler = new CommandHandler((state, command) => {
  if (state instanceof StartingState && command.type === In.type) {
    if (!state.interested.some(x => x === command.member.user)) {
      const interested = [...state.interested, command.member.user]
      return CompositeAction(
        NewState(new StartingState(state.context, interested)),
        OptionalAction(interested.length === Math.max(state.context.minPlayers, 5) && state.begin())
      )
    }
  }
})