import { CompositeAction, NewState, DelayedAction, FromStateAction, Send, PromiseAction, OptionalAction } from '../../actions';
import { choosePrompt } from '../prompts';
import { WittyGameContext } from '../context';
import { NewRoundMessage } from '../messages';
import { WaitingState } from './WaitingState';
import { SubmissionState } from './SubmissionState'

export function newRound(context: WittyGameContext) {
  const roundCtx = context.newRound()

  const prompt = choosePrompt(roundCtx)

  return CompositeAction(
    NewState(new WaitingState(context)),
    PromiseAction(prompt.then(prompt =>
      CompositeAction(
        NewState(SubmissionState.begin(roundCtx, prompt)),
        DelayedAction(context.timeout, FromStateAction(context.guild, state => OptionalAction(state instanceof SubmissionState && state.context.sameRound(roundCtx) && state.finish()))),
        Send(context.channel, new NewRoundMessage(roundCtx, prompt, context.timeout))
      )))
  )
}