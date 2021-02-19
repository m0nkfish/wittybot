import { CommandFactory } from '../../commands/scoped-command-factory';
import { ReactionRemoved } from '../../discord-events';
import { Retract } from '../commands/retract';
import { NightRoleMessage } from '../messages';
import { NightState } from '../state';

export const RetractNightActionFactory = () => CommandFactory.build.state(NightState).event(ReactionRemoved)
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

    const intention = state.intentions.get(player)
    if (!intention) {
      return
    }

    const command = message.getCommand(reaction.emoji.name)
    if (!command || intention.type !== command.type || intention.target !== command.target) {
      return
    }

    return Retract(player)
  })