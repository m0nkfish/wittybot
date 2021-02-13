import * as Discord from 'discord.js'

import { Duration } from '../../duration';
import { CompositeAction, Send, SaveRound, OptionalAction } from '../actions';
import { Prompt } from '../prompts';
import { WittyRoundContext } from '../context';
import { Round } from '../round'
import { VotingFinishedMessage } from '../messages';
import { GameState } from '../../state';
import { endRound } from './endRound';
import { Timer } from '../../util';

type Submission = { user: Discord.User, submission: string }

/** Submission phase complete; voting stage */
export class VotingState implements GameState<WittyRoundContext> {

  constructor(
    readonly context: WittyRoundContext,
    readonly prompt: Prompt,
    readonly submissions: Submission[],
    readonly votes: Map<Discord.User, number>,
    readonly timer: Timer) { }

  remaining = (): Duration => Duration.seconds(this.submissions.length * 10).subtract(this.timer.duration())

  allVotesIn = () => this.votes.size === this.submissions.length

  withVote = (user: Discord.User, entry: number) =>
    new VotingState(this.context, this.prompt, this.submissions, new Map(this.votes).set(user, entry), this.timer)

  finish = () => {
    const withVotes = [...this.submissions.map(x => ({ ...x, votes: [] as Discord.User[], voted: false }))]
    this.votes.forEach((entry, user) => withVotes[entry - 1].votes.push(user))
    withVotes.forEach(x => {
      if (this.votes.has(x.user)) {
        x.voted = true
      }
    })

    withVotes.sort((a, b) => {
      if (a.voted && !b.voted) {
        return -1
      }
      if (!a.voted && b.voted) {
        return 1
      }
      return b.votes.length - a.votes.length
    })

    const round: Round = {
      id: this.context.roundId,
      channel: this.context.channel,
      prompt: this.prompt,
      submissions: new Map(withVotes.map(x => [x.user, x])),
      skipped: false
    }

    const newContext = this.context.gameCtx.addRound(round)

    return CompositeAction(
      Send(this.context.channel, new VotingFinishedMessage(newContext, this.prompt, withVotes)),
      OptionalAction(!this.context.inTestMode && SaveRound(round)),
      endRound(newContext)
    )
  }

  static begin = (context: WittyRoundContext, prompt: Prompt, submissions: Submission[]) =>
    new VotingState(context, prompt, submissions, new Map(), Timer.begin())
}

