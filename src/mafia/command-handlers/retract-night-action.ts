import { NewState } from '../../actions';
import { CommandHandler } from '../../commands';
import { Retract } from '../commands/retract';
import { NightState } from '../state';

export const RetractNightActionHandler = () => CommandHandler.build.state(NightState).command(Retract)
  .sync((state, {player}) => {
    const existingIntention = state.intentions.get(player)
    if (!existingIntention) {
      return
    }

    return NewState(state.cancelIntention(player))
  })
