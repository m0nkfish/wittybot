import { CommandFactory } from '../../commands';
import { Skip } from '../commands';
import { SubmissionState } from '../state/SubmissionState';

export const SkipFactory = () => new CommandFactory((state, message) => {
  if (state instanceof SubmissionState && message.channel === state.context.channel && message.content === '!skip') {
    return Skip()
  }
})