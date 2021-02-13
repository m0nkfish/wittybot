import { Case } from '../../case'
import { CommandFactory } from '../../command';
import { SubmissionState } from '../state/SubmissionState';

export const Skip = Case('witty-skip', () => ({}))

export const SkipFactory = new CommandFactory((state, message) => {
  if (state instanceof SubmissionState && message.channel === state.context.channel && message.content === '!skip') {
    return Skip()
  }
})