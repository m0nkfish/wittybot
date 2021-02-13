import * as Discord from 'discord.js';
import { CommandHandler } from '../../command-handler';
import { SubmissionState } from '../state';
import { Submit } from '../commands';
import { CompositeAction, OptionalAction, Send, UpdateState } from '../actions';
import { SubmissionAcceptedMessage } from '../messages';
import { BasicMessage, mention } from '../../messages';

export const SubmitHandler = CommandHandler.sync((state, command) => {
  if (state instanceof SubmissionState && command.type === Submit.type) {
    if (command.submission.length > 280) {
      return Send(command.user, new BasicMessage('Submissions cannot be more than 280 characters long'))
    }

    const isReplacement = state.submissions.has(command.user)

    return CompositeAction(
      OptionalAction(command.message.channel instanceof Discord.DMChannel && Send(command.user, new SubmissionAcceptedMessage(state.prompt, command.submission, isReplacement))),
      OptionalAction(!isReplacement && Send(state.context.channel, new BasicMessage(`Submission received from ${mention(command.user)}`))),
      UpdateState(state.context.guild, newState => newState instanceof SubmissionState && newState.context.sameRound(state.context) ? newState.withSubmission(command.user, command.submission) : newState))
  }
})