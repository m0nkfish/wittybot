import { CommandFactory } from '../../commands/scoped-command-factory';
import { ReactionAdded } from '../../discord-events';
import { NightState } from '../state';
import { NightRoleMessage } from '../messages';

export const NightActionsFactory = () => CommandFactory.build.state(NightState).event(ReactionAdded)
  .process((state, { reaction, user, message }) => {
    if (!(message instanceof NightRoleMessage)) {
      return
    }

    if (!state.context.sameGame(message.context) || state.round !== message.round) {
      return
    }
    
    const target = message.findTarget(reaction.emoji.name)
    if (!target) {
      return
    }

    return message.command(user, target)
  })