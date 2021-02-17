import { CommandHandler } from '../../commands';
import { mention, BasicMessage } from '../../messages';
import { NewState, Send } from '../../actions';
import { Vote } from '../commands';
import { DayState } from '../state/DayState';

export const VoteHandler = () => CommandHandler.build.state(DayState).command(Vote)
  .sync((state, command) => {
    const { user, target } = command
    if (!state.players.checkAction(user, Vote) || !state.players.isAlive(target)) {
      return
    }

    if (user === target) {
      return Send(user, new BasicMessage(`You cannot vote for yourself`))
    }

    const existingVote = state.playerVotes.get(user)
    if (existingVote) {
      return Send(user, new BasicMessage(`You have already chosen to vote for ${mention(existingVote)}`))
    }

    return NewState(state.vote(user, target))
  })

