import { CommandHandler } from '../../command-handler';
import { SubmissionState, endRound } from '../state';
import { Skip } from '../commands';
import { CompositeAction, SaveRound, Send } from '../../actions';
import { BasicMessage } from '../../messages';

export const SkipHandler = CommandHandler.build.state(SubmissionState).command(Skip).sync(state => {
  if (state.submissions.size > 0) {
    return Send(state.context.channel, new BasicMessage(`Prompt already has submissions; won't skip`))
  }
  
  const skippedRound = {
    id: state.context.roundId,
    channel: state.context.channel,
    prompt: state.prompt,
    skipped: true,
    submissions: new Map()
  }
  return CompositeAction(
    SaveRound(skippedRound),
    Send(state.context.channel, new BasicMessage(`Skipping this prompt`)),
    endRound(state.context.gameCtx))
})