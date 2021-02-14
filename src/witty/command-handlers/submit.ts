import * as Discord from 'discord.js';
import { CommandHandler } from '../../commands';
import { SubmissionState } from '../state';
import { Submit } from '../commands';
import { CompositeAction, OptionalAction, Send, UpdateState } from '../../actions';
import { SubmissionAcceptedMessage } from '../messages';
import { BasicMessage, mention } from '../../messages';

export const SubmitHandler = () => CommandHandler.build.state(SubmissionState).command(Submit).sync((state, command) => {
  if (command.submission.length > 280) {
    return Send(command.user, new BasicMessage('Submissions cannot be more than 280 characters long'))
  }

  const isReplacement = state.submissions.has(command.user)

  return CompositeAction(
    OptionalAction(command.message.channel instanceof Discord.DMChannel && Send(command.user, new SubmissionAcceptedMessage(state.prompt, command.submission, isReplacement))),
    OptionalAction(!isReplacement && Send(state.context.channel, new BasicMessage(`Submission received from ${mention(command.user)}`))),
    UpdateState(state.context.guild, s => s instanceof SubmissionState && s.context.sameRound(state.context) ? s.withSubmission(command.user, command.submission) : s))
})