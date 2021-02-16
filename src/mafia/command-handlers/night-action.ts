import { CommandHandler } from '../../commands';
import { NightState } from '../state';
import { actionText } from '../messages';
import { mention, BasicMessage } from '../../messages';
import { CompositeAction, NewState, OptionalAction, Send } from '../../actions';
import { MafiaRoleCommandFactory } from '../commands';

export const NightActionHandler = (action: MafiaRoleCommandFactory) => CommandHandler.build.state(NightState)
  .sync((state, command) => {
    if (command.type !== action.type) {
      return
    }

    const { user, target } = command
    if (!state.players.checkAction(user, action) || !state.players.isAlive(target)) {
      return
    }

    const existingIntention = state.intentions.getIntention(user)
    if (existingIntention) {
      return Send(user, new BasicMessage(`You have already chosen to ${actionText(existingIntention.action)} ${mention(existingIntention.target)}`))
    }

    const partner = state.players.findPartner(user)
    if (partner) {
      const existingIntention = state.intentions.getIntention(partner)
      if (existingIntention) {
        return Send(user, new BasicMessage(`Your partner, ${mention(partner)}, has already chosen to ${actionText(existingIntention.action)} ${mention(existingIntention.target)}`))
      }
    }

    return CompositeAction(
      OptionalAction(partner && Send(partner, new BasicMessage(`Your partner, ${mention(user)}, has chosen to ${actionText(action)} ${mention(target)}`))),
      Send(user, new BasicMessage(`You have chosen to ${actionText(action)} ${mention(target)}`)),
      NewState(state.withIntention(user, { target, action }))
    )
  })

