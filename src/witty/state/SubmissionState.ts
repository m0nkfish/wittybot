import * as Discord from 'discord.js'
import { Command, Submit, Skip } from '../commands';
import { Action, CompositeAction, NewState, DelayedAction, FromStateAction, UpdateState, Send, SaveRound, OptionalAction } from '../actions';
import { Prompt } from '../prompts';
import { shuffle } from 'random-js';
import { mt } from '../random';
import { RoundContext } from '../context';
import { Scores } from '../scores';
import { BasicMessage, VoteMessage, SubmissionAcceptedMessage, ScoresByRatingMessage, mention } from '../messages';
import { GameState } from './GameState';
import { VotingState } from './VotingState';
import { endRound } from './endRound';
import { IdleState } from './IdleState';
import { log } from '../../log';

/** Prompt decided, submissions being accepted */
export class SubmissionState implements GameState<RoundContext> {

  constructor(
    readonly context: RoundContext,
    readonly prompt: Prompt,
    readonly submissions: Map<Discord.User, string>) { }

  interpreter = (message: Discord.Message) => {
    if (message.channel instanceof Discord.DMChannel) {
      return Submit(message.content, message)
    } else if (message.channel === this.context.channel) {
      if (message.content === '!skip') {
        return Skip()
      }

      const spoilered = message.content.match(/^\|\|(.*)\|\|$/)
      if (spoilered && spoilered[1]) {
        try {
          message.delete({ reason: 'Message recognised as wittybot submission' })
        } catch (e) {
          const error = e instanceof Error ? e.message : 'unknown'
          log.warn('delete_failed', { error })
        }
        return Submit(spoilered[1], message)
      }
    }
  }

  receive(command: Command): Action | undefined {
    if (command.type === 'submit') {
      if (command.submission.length > 280) {
        return Send(command.user, new BasicMessage('Submissions cannot be more than 280 characters long'))
      }

      const isReplacement = this.submissions.has(command.user)

      return CompositeAction(
        OptionalAction(command.message.channel instanceof Discord.DMChannel && Send(command.user, new SubmissionAcceptedMessage(this.prompt, command.submission, isReplacement))),
        OptionalAction(!isReplacement && Send(this.context.channel, new BasicMessage(`Submission received from ${mention(command.user)}`))),
        UpdateState(this.context.guild, state => state instanceof SubmissionState && state.context.sameRound(this.context) ? state.withSubmission(command.user, command.submission) : state),
      )
    } else if (command.type === 'skip') {
      if (this.submissions.size === 0) {
        const skippedRound = {
          id: this.context.roundId,
          channel: this.context.channel,
          prompt: this.prompt,
          skipped: true,
          submissions: new Map()
        }
        return CompositeAction(
          SaveRound(skippedRound),
          Send(this.context.channel, new BasicMessage(`Skipping this prompt`)),
          endRound(this.context.gameCtx)
        )
      } else {
        return Send(this.context.channel, new BasicMessage(`Prompt already has submissions; won't skip`))
      }
    }
  }

  withSubmission = (user: Discord.User, submission: string) =>
    new SubmissionState(this.context, this.prompt, new Map(this.submissions).set(user, submission))

  finish = (): Action => {
    if ((!this.context.inTestMode && this.submissions.size < this.context.minPlayers) || this.submissions.size < 1) {
      return CompositeAction(
        Send(this.context.channel, new BasicMessage(`Not enough players to continue (${this.submissions.size}/${this.context.minPlayers})`)),
        Send(this.context.channel, new ScoresByRatingMessage(Scores.fromRounds(this.context.rounds), 'from this game')),
        NewState(new IdleState(this.context.guildCtx))
      )
    }

    const shuffled = shuffle(mt, Array.from(this.submissions).map(([user, submission]) => ({ user, submission })))

    const voteDurationSec = this.submissions.size * 10

    return CompositeAction(
      NewState(VotingState.begin(this.context, this.prompt, shuffled)),
      DelayedAction(voteDurationSec * 1000, FromStateAction(this.context.guild, state => OptionalAction(state instanceof VotingState && state.context.sameRound(this.context) && state.finish()))),
      Send(this.context.channel, new VoteMessage(this.context, this.prompt, shuffled, this.context.botUser, voteDurationSec))
    )
  }

  static begin = (context: RoundContext, prompt: Prompt) => new SubmissionState(context, prompt, new Map())
}