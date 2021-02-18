import { CommandFactory } from '../../commands/scoped-command-factory';
import { ReactionAdded } from '../../discord-events';
import { Vote } from '../commands';
import { DayBeginsPublicMessage } from '../messages/DayBeginsPublicMessage';
import { DayState } from '../state/DayState';

export const VoteFactory = () => CommandFactory.build.state(DayState).event(ReactionAdded)
  .process((state, { reaction, user, message }) => {
    if (!(message instanceof DayBeginsPublicMessage)) {
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

    return Vote(player, target)
  })