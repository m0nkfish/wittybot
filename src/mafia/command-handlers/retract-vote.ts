import { NewState } from '../../actions';
import { CommandHandler } from '../../commands';
import { Retract } from '../commands';
import { DayState } from '../state';

export const RetractVoteHandler = () => CommandHandler.build.state(DayState).command(Retract)
  .sync((state, { player }) => NewState(state.cancelVote(player)))
