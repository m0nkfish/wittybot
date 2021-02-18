import { CommandFactory } from '../../commands/scoped-command-factory';
import { ReactionAdded } from '../../discord-events';
import { NightRoleMessage } from '../messages';
import { NightState } from '../state';

export const NightActionsFactory = () => CommandFactory.build.state(NightState).event(ReactionAdded)
  .process((state, { reaction, user, message }) => {
    if (!(message instanceof NightRoleMessage)) {
      return
    }

    if (!state.context.sameRound(message.context)) {
      return
    }

    const player = state.players.find(user)
    if (!player) {
      return
    }
    
    const target = message.findTarget(reaction.emoji.name)
    if (!target) {
      return
    }

    return message.command(player, target)
  })