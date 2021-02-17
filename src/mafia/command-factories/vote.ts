import { CommandFactory } from '../../commands/scoped-command-factory';
import { ReactionAdded } from '../../discord-events';
import { DayState } from '../state/DayState';
import { DayBeginsPublicMessage } from '../messages/DayBeginsPublicMessage';
import { Vote } from '../commands';

export const VoteFactory = () => CommandFactory.build.state(DayState).event(ReactionAdded)
  .process((state, { reaction, user, message }) => {
    if (!(message instanceof DayBeginsPublicMessage)) {
      return
    }

    if (!state.context.sameGame(message.context) || state.round !== message.round) {
      return
    }

    const target = message.findTarget(reaction.emoji.name)
    if (!target) {
      return
    }

    return Vote(user, target)
  })