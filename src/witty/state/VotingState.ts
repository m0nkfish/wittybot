import * as Discord from 'discord.js'

import { Command } from '../commands';
import { Action, CompositeAction, NewState, FromStateAction, NullAction, Send, SaveRound, OptionalAction } from '../actions';
import { Prompt } from '../prompts';
import { Round, WittyRoundContext } from '../context';
import { VotingFinishedMessage, VoteAcceptedMessage } from '../messages';
import { BasicMessage } from '../../messages';
import { GameState } from '../../state';
import { endRound } from './endRound';
import { VoteFactory, Vote } from '../command-factory';

type Submission = { user: Discord.User, submission: string }

/** Submission phase complete; voting stage */
export class VotingState implements GameState<WittyRoundContext> {

  constructor(
    readonly context: WittyRoundContext,
    readonly prompt: Prompt,
    readonly submissions: Submission[],
    readonly votes: Map<Discord.User, number>) { }

  interpreter = (message: Discord.Message): Command | undefined =>
    VoteFactory.process(this, message)

  receive(command: Command): Action | undefined {
    if (command.type === Vote.type) {
      const { entry, user, message } = command
      if (entry < 1 || this.submissions.length < entry) {
        return Send(user, new BasicMessage(`You must vote between 1 and ${this.submissions.length}`))
      }

      if (!this.submissions.some(x => x.user === user)) {
        return Send(user, new BasicMessage(`You must have submitted an entry in order to vote`))
      }

      const submission = this.submissions[entry - 1]
      if (!submission) {
        return
      }
      if (!this.context.inTestMode && submission.user === user) {
        return Send(user, new BasicMessage(`You cannot vote for your own entry`))
      }

      return CompositeAction(
        OptionalAction(message.channel instanceof Discord.DMChannel && Send(user, new VoteAcceptedMessage(this.prompt, entry, submission.submission))),
        FromStateAction(this.context.guild, state => {
          if (state instanceof VotingState && state.context.sameRound(this.context)) {
            const newState = state.withVote(user, entry)
            return newState.allVotesIn()
              ? newState.finish()
              : NewState(newState)
          } else {
            return NullAction()
          }
        })
      )
    }
  }

  allVotesIn = () => this.votes.size === this.submissions.length

  withVote = (user: Discord.User, entry: number) =>
    new VotingState(this.context, this.prompt, this.submissions, new Map(this.votes).set(user, entry))

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
    new VotingState(context, prompt, submissions, new Map())
}

