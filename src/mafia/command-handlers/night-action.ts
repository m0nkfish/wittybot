import { CompositeAction, NewState, Send } from '../../actions';
import { CommandHandler } from '../../commands';
import { BasicMessage, mention } from '../../messages';
import { MafiaRoleCommandFactory } from '../commands';
import { actionText } from '../messages';
import { NightState } from '../state';

export const NightActionHandler = (action: MafiaRoleCommandFactory) => CommandHandler.build.state(NightState)
  .sync((state, command) => {
    if (command.type !== action.type) {
      return
    }

    const { user, target } = command
    if (!user.canPerform(action) || !target.isAlive) {
      return
    }
    const existingIntention = state.intentions.getIntention(user)
    if (existingIntention) {
      return Send(user.user, new BasicMessage(`You have already chosen to ${actionText(existingIntention.action)} ${mention(existingIntention.target.user)}`))
    }

    const partners = state.players.findPartners(user) ?? []
    for (const partner of partners) {
      const existingIntention = state.intentions.getIntention(partner)
      if (existingIntention) {
        return Send(user.user, new BasicMessage(`Your partner, ${mention(partner.user)}, has already chosen to ${actionText(existingIntention.action)} ${mention(existingIntention.target.user)}`))
      }
    }

    if (user === target) {
      return Send(user.user, new BasicMessage(`You cannot ${actionText(action)} yourself`))
    }

    return CompositeAction(
      ...partners.map(partner => Send(partner.user, new BasicMessage(`Your partner, ${mention(user.user)}, has chosen to ${actionText(action)} ${mention(target.user)}`))),
      Send(user.user, new BasicMessage(`You have chosen to ${actionText(action)} ${mention(target.user)}`)),
      NewState(state.withIntention(user, action, target))
    )
  })

