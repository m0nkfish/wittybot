import { CommandFactory } from '../../commands/scoped-command-factory';
import { ReactionRemoved } from '../../discord-events';
import { Retract } from '../commands/retract';
import { DayBeginsPublicMessage } from '../messages';
import { DayState } from '../state/DayState';

export const RetractVoteFactory = () => CommandFactory.build.state(DayState).event(ReactionRemoved)
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

    const vote = state.votes.get(player)
    if (!vote) {
      return
    }

    const target = message.findTarget(reaction.emoji.name)
    if (!target || vote !== target) {
      return
    }

    return Retract(player)
  })