import { CommandFactory } from '../../commands';
import { MessageReceived } from '../../discord-events';
import { Skip } from '../commands';
import { SubmissionState } from '../state/SubmissionState';

export const SkipFactory = () => CommandFactory.build.state(SubmissionState).event(MessageReceived).process(((state, { message }) => {
  if (message.channel === state.context.channel && message.content === '!skip') {
    return Skip()
  }
}))