import * as Discord from 'discord.js'
import { Action, CompositeAction, NewState, DelayedAction, FromStateAction, Send, OptionalAction } from '../actions';
import { Prompt } from '../prompts';
import { shuffle } from 'random-js';
import { mt } from '../../random';
import { WittyRoundContext } from '../context';
import { Scores } from '../scores';
import { VoteMessage, ScoresByRatingMessage } from '../messages';
import { BasicMessage } from '../../messages';
import { VotingState } from './VotingState';
import { IdleState, GameState } from '../../state';
import { Timer } from '../../util';
import { Duration } from '../../duration';

/** Prompt decided, submissions being accepted */
export class SubmissionState implements GameState<WittyRoundContext> {

  constructor(
    readonly context: WittyRoundContext,
    readonly prompt: Prompt,
    readonly submissions: Map<Discord.User, string>,
    readonly timer: Timer) { }

  remaining = () => this.context.timeout.subtract(this.timer.duration())

  withSubmission = (user: Discord.User, submission: string) =>
    new SubmissionState(this.context, this.prompt, new Map(this.submissions).set(user, submission), this.timer)

  finish = (): Action => {
    if ((!this.context.inTestMode && this.submissions.size < this.context.minPlayers) || this.submissions.size < 1) {
      return CompositeAction(
        Send(this.context.channel, new BasicMessage(`Not enough players to continue (${this.submissions.size}/${this.context.minPlayers})`)),
        Send(this.context.channel, new ScoresByRatingMessage(Scores.fromRounds(this.context.rounds), 'from this game')),
        NewState(new IdleState(this.context.guildCtx))
      )
    }

    const shuffled = shuffle(mt, Array.from(this.submissions).map(([user, submission]) => ({ user, submission })))

    const voteDuration = Duration.seconds(this.submissions.size * 10)

    return CompositeAction(
      NewState(VotingState.begin(this.context, this.prompt, shuffled)),
      DelayedAction(voteDuration, FromStateAction(this.context.guild, state => OptionalAction(state instanceof VotingState && state.context.sameRound(this.context) && state.finish()))),
      Send(this.context.channel, new VoteMessage(this.context, this.prompt, shuffled, this.context.botUser, voteDuration))
    )
  }

  static begin = (context: WittyRoundContext, prompt: Prompt) => new SubmissionState(context, prompt, new Map(), Timer.begin())
}