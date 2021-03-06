import { NewState, Send, toAction } from '../../actions';
import { CommandHandler } from '../../commands';
import { BasicMessage, mention } from '../../messages';
import { Vote } from '../commands';
import { DayState } from '../state';

export const VoteHandler = () => CommandHandler.build.state(DayState).command(Vote)
  .sync((state, command) => {
    const { user, target } = command
    if (!user.canPerform(command)) {
      return
    }

    if (user === target) {
      return Send(user.user, new BasicMessage(`You cannot vote for yourself`))
    }

    const existingVote = state.votes.get(user)
    if (existingVote) {
      return Send(user.user, new BasicMessage(`You have already chosen to vote for ${mention(existingVote.user)}`))
    }

    const newState = state.vote(user, target)

    return toAction(function* () {
      yield NewState(newState)
      if (newState.allVoted()) {
        return newState.sundown()
      }
    })
  })

