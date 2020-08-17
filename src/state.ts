import * as Discord from 'discord.js'
import { Command, Begin, Submit, Vote, Skip } from './commands';
import { Action, CompositeAction, NewState, DelayedAction, FromStateAction, NullAction, UpdateState, Send, PromiseAction, SaveRound, OptionalAction } from './actions';
import { choosePrompt, Prompt } from './prompts';
import { shuffle } from 'random-js';
import { mt } from './random';
import { Context, Round, RoundContext } from './context';
import { Scores } from './scores';
import { getNotifyRole } from './notify';
import { NewRoundMessage, GameStartedMessage, BasicMessage, VoteMessage, VotingFinishedMessage } from './messages';

type Submission = { user: Discord.User, submission: string }

export type AnyGameState = GameState<Context | RoundContext>

export type GameState<Context> = {
  readonly context: Context
  interpreter(message: Discord.Message): Command | undefined
  receive(command: Command): Action | undefined
}

/** Default state, no active game */
export class IdleState implements GameState<Context> {
  constructor(readonly context: Context) { }

  readonly interpreter = (message: Discord.Message) =>
    message.channel instanceof Discord.TextChannel && message.content === "!witty"
      ? Begin(message.author, message.channel)
      : undefined

  receive(command: Command): Action | undefined {
    if (command.type === 'begin') {
      const notifyRole = getNotifyRole(command.channel.guild)
      const initiator = command.user
      const start = IdleState.newRound(this.context.start(command.channel, initiator))
      return CompositeAction(
        OptionalAction(notifyRole && !this.context.inTestMode && Send(command.channel, new GameStartedMessage(notifyRole, command.user))),
        start
      )
    }
  }

  static newRound = (context: RoundContext) => {
    context = context.nextRound()


    const prompt = choosePrompt(context)

    return CompositeAction(
      NewState(new WaitingState(context)),
      PromiseAction(prompt.then(prompt =>
        CompositeAction(
          NewState(SubmissionState.begin(context, prompt)),
          DelayedAction(context.config.submitDurationSec * 1000, FromStateAction(state => OptionalAction(state instanceof SubmissionState && state.context.sameRound(context) && state.finish()))),
          Send(context.channel, new NewRoundMessage(context.roundId, prompt, context.botUser, context.config.submitDurationSec))
        )))
    )
  }
}

export class WaitingState implements GameState<RoundContext> {
  constructor(readonly context: RoundContext) { }

  interpreter = () => undefined

  receive = () => undefined
}

/** Prompt decided, submissions being accepted */
export class SubmissionState implements GameState<RoundContext> {

  constructor(
    readonly context: RoundContext,
    readonly prompt: Prompt,
    readonly submissions: Map<Discord.User, string>) { }

  interpreter = (message: Discord.Message) => {
    if (message.channel instanceof Discord.DMChannel) {
      return Submit(message.author, message.content)
    } else if (message.channel === this.context.channel && message.content === '!skip') {
      return Skip(message.author, message.channel)
    }
  }

  receive(command: Command): Action | undefined {
    if (command.type === 'submit') {
      if (command.submission.length > 280) {
        return Send(command.user, new BasicMessage('Submissions cannot be more than 280 characters long'))
      }

      const messages =
        this.submissions.has(command.user)
          ? [Send(command.user, new BasicMessage(`Replacement submission accepted`))]
          : [
            Send(command.user, new BasicMessage(`Submission accepted, DM again to replace it`)),
            Send(this.context.channel, new BasicMessage(`Submission received from <@${command.user.id}>`))
          ]

      return CompositeAction(
        ...messages,
        UpdateState(state => state instanceof SubmissionState && state.context.sameRound(this.context) ? state.withSubmission(command.user, command.submission) : state),
      )
    } else if (command.type === 'skip') {
      if (this.submissions.size === 0) {
        const skippedRound = {
          id: this.context.roundId,
          prompt: this.prompt,
          skipped: true,
          submissions: new Map()
        }
        return CompositeAction(
          SaveRound(skippedRound),
          Send(command.channel, new BasicMessage(`Skipping this prompt`)),
          endRound(this.context)
        )
      } else {
        return Send(command.channel, new BasicMessage(`Prompt already has submissions; won't skip`))
      }
    }
  }

  withSubmission = (user: Discord.User, submission: string) =>
    new SubmissionState(this.context, this.prompt, new Map(this.submissions).set(user, submission))

  finish = (): Action => {
    if ((!this.context.inTestMode && this.submissions.size < 3) || this.submissions.size < 1) {
      return CompositeAction(
        Send(this.context.channel, new BasicMessage(`Not enough submissions to continue`)),
        Scores.fromRounds(this.context.rounds).show(this.context.channel),
        NewState(new IdleState(this.context.baseContext))
      )
    }

    const shuffled = shuffle(mt, Array.from(this.submissions).map(([user, submission]) => ({ user, submission })))

    const voteDurationSec = this.submissions.size * 10

    return CompositeAction(
      NewState(VotingState.begin(this.context, this.prompt, shuffled)),
      DelayedAction(voteDurationSec * 1000, FromStateAction(state => OptionalAction(state instanceof VotingState && state.context.sameRound(this.context) && state.finish()))),
      Send(this.context.channel, new VoteMessage(this.context.roundId, this.prompt, shuffled, this.context.botUser, voteDurationSec))
    )
  }

  static begin = (context: RoundContext, prompt: Prompt) => new SubmissionState(context, prompt, new Map())
}

/** Submission phase complete; voting stage */
export class VotingState implements GameState<RoundContext> {

  constructor(
    readonly context: RoundContext,
    readonly prompt: Prompt,
    readonly submissions: Submission[],
    readonly votes: Map<Discord.User, number>) { }

  interpreter = (message: Discord.Message) => {
    if (message.channel instanceof Discord.DMChannel) {
      const entry = tryParseInt(message.content)
      if (entry !== null) {
        return Vote(message.author, entry)
      }
    }
  }

  receive(command: Command): Action | undefined {
    if (command.type === 'vote') {
      const { entry, user } = command
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
        Send(user, new BasicMessage(`Vote recorded for entry ${entry}: '${submission.submission}', DM again to replace it`)),
        FromStateAction(state => {
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
      prompt: this.prompt,
      submissions: new Map(withVotes.map(x => [x.user, x])),
      skipped: false
    }

    const newContext = this.context.addRound(round)

    return CompositeAction(
      Send(this.context.channel, new VotingFinishedMessage(this.prompt, withVotes)),
      OptionalAction(!this.context.inTestMode && SaveRound(round)),
      endRound(newContext)
    )
  }

  static begin = (context: RoundContext, prompt: Prompt, submissions: Submission[]) =>
    new VotingState(context, prompt, submissions, new Map())
}

function endRound(context: RoundContext) {
  return CompositeAction(
    NewState(new WaitingState(context)),
    DelayedAction(5000, FromStateAction(state => OptionalAction(state instanceof WaitingState && state.context.sameRound(context) && IdleState.newRound(context))))
  )
}

const tryParseInt = (str: string) => {
  try {
    const entry = Number.parseInt(str)
    if (!isNaN(entry)) {
      return entry
    }
  } catch {
  }
  return null
}
