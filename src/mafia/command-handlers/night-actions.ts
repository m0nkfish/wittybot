import { CommandFactory } from '../../commands/scoped-command-factory';
import { ReactionAdded } from '../../discord-events';
import { NightState } from '../state';
import { NightRoleMessage } from '../messages';

export const NightActionsCommandHandler = CommandFactory.build.state(NightState).event(ReactionAdded)
  .process((_, { reaction, user, message }) => {
    if (!(message instanceof NightRoleMessage)) {
      return
    }
    
    const target = message.options.find(([emoji]) => emoji === reaction.emoji.name)?.[1]
    if (!target) {
      return
    }

    return message.command(user, target)
  })