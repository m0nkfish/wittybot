import { NewState } from '../../actions';
import { CommandHandler } from '../../commands';
import { Retract } from '../commands/retract';
import { DayState } from '../state/DayState';

export const RetractVoteHandler = () => CommandHandler.build.state(DayState).command(Retract)
  .sync((state, { player }) => {
    const existingVote = state.votes.get(player)
    if (!existingVote) {
      return
    }

    return NewState(state.cancelVote(player))
  })
