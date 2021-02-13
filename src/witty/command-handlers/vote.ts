import * as Discord from 'discord.js';
import { CommandHandler } from '../../command-handler';
import { VotingState } from '../state';
import { Vote } from '../commands';
import { CompositeAction, FromStateAction, NewState, NullAction, OptionalAction, Send } from '../actions';
import { BasicMessage } from '../../messages';
import { VoteAcceptedMessage } from '../messages';

export const VoteHandler = CommandHandler.sync((state, command) => {
  if (state instanceof VotingState && command.type === Vote.type) {
    const { entry, user, message } = command
    if (entry < 1 || state.submissions.length < entry) {
      return Send(user, new BasicMessage(`You must vote between 1 and ${state.submissions.length}`))
    }

    if (!state.submissions.some(x => x.user === user)) {
      return Send(user, new BasicMessage(`You must have submitted an entry in order to vote`))
    }

    const submission = state.submissions[entry - 1]
    if (!submission) {
      return
    }
    if (!state.context.inTestMode && submission.user === user) {
      return Send(user, new BasicMessage(`You cannot vote for your own entry`))
    }

    return CompositeAction(
      OptionalAction(message.channel instanceof Discord.DMChannel && Send(user, new VoteAcceptedMessage(state.prompt, entry, submission.submission))),
      FromStateAction(state.context.guild, s1 => {
        if (s1 instanceof VotingState && s1.context.sameRound(state.context)) {
          const newState = s1.withVote(user, entry)
          return newState.allVotesIn()
            ? newState.finish()
            : NewState(newState)
        } else {
          return NullAction()
        }
      })
    )
  }
})