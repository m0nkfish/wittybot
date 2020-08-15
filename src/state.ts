import * as Discord from 'discord.js'
import { Command, Begin, Submit, Vote, Skip } from './commands';
import { Action, CompositeAction, NewState, DelayedAction, EmbedMessage, FromStateAction, NullAction, UpdateState, Send } from './actions';
import { choosePrompt } from './prompts';
import { shuffle, uuid4 } from 'random-js';
import { mt } from './random';
import { Context } from './context';
import { Scores } from './scores';
import { getNotifyRole } from './notify';
import { NewRoundMessage, GameStartedMessage, BasicMessage } from './messages';

type Prompt = string
type Submission = { user: Discord.User, submission: string }

export type GameState = {
  readonly context: Context
  interpreter(message: Discord.Message): Command | undefined
  receive(command: Command): Action | undefined
}

type GameContext = Context & {
  gameId: string
}

/** Default state, no active game */
export class IdleState implements GameState {
  constructor(readonly context: Context) { }

  readonly interpreter = (message: Discord.Message) =>
    message.channel instanceof Discord.TextChannel && message.content === "!witty"
      ? Begin(message.author, message.channel)
      : undefined

  receive(command: Command): Action | undefined {
    if (command.type === 'begin') {
      const notifyRole = getNotifyRole(command.channel.guild)
      const start = this.startRound(command.channel, [command.user])
      return notifyRole
        ? CompositeAction([
          Send(command.channel, new GameStartedMessage(notifyRole, command.user)),
          start
        ])
        : start
    }
  }

  startRound = (channel: Discord.TextChannel, users: Discord.User[]) => {
    const prompt = choosePrompt(users.map(u => u.username))
    const gameId = uuid4(mt)

    return CompositeAction([
      NewState(SubmissionState.begin({ ...this.context, gameId, users }, channel, prompt)),
      DelayedAction(this.context.config.submitDurationSec * 1000, FromStateAction(state => state instanceof SubmissionState && state.context.gameId === gameId ? state.finish() : NullAction())),
      Send(channel, new NewRoundMessage(this.context.client.user!, this.context.config.submitDurationSec))
    ])
  }
}

/** Prompt decided, submissions being accepted */
export class SubmissionState implements GameState {

  constructor(
    readonly context: GameContext,
    readonly channel: Discord.TextChannel,
    readonly prompt: Prompt,
    readonly submissions: Map<Discord.User, string>) { }

  interpreter = (message: Discord.Message) => {
    if (message.channel instanceof Discord.DMChannel) {
      return Submit(message.author, message.content)
    } else if (message.channel === this.channel && message.content === '!skip') {
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
            Send(this.channel, new BasicMessage(`Submission received from <@${command.user.id}>`))
          ]

      return CompositeAction([
        ...messages,
        UpdateState(state => state instanceof SubmissionState ? state.withSubmission(command.user, command.submission) : state),
      ])
    } else if (command.type === 'skip') {
      if (this.submissions.size === 0) {
        return CompositeAction([
          Send(command.channel, new BasicMessage(`Skipping this prompt`)),
          endGame(this.context, this.channel)
        ])
      } else {
        return Send(command.channel, new BasicMessage(`Prompt already has submissions; won't skip`))
      }
    }
  }

  withSubmission = (user: Discord.User, submission: string) =>
    new SubmissionState(this.context, this.channel, this.prompt, new Map(this.submissions).set(user, submission))

  finish = (): Action => {
    if ((!this.context.config.testMode && this.submissions.size < 3) || this.submissions.size < 1) {
      return CompositeAction([
        Send(this.channel, new BasicMessage(`Not enough submissions to continue`)),
        this.context.scores.show(this.channel),
        NewState(new IdleState(this.context))
      ])
    }

    const shuffled = shuffle(mt, Array.from(this.submissions).map(([user, submission]) => ({ user, submission })))

    const voteDurationSec = this.submissions.size * 10

    const embed = new Discord.MessageEmbed()
      .setTitle(`Time's up!`)
      .setDescription([
        `**${this.prompt}**`,
        ``,
        ...shuffled.map((x, i) => `${i + 1}. ${x.submission}`),
        ``,
        `Vote for your favourite by DMing <@${this.context.client.user?.id}> with the entry number`
      ])
      .setFooter(`You have ${voteDurationSec} seconds`)

    return CompositeAction([
      NewState(VotingState.begin(this.context, this.channel, this.prompt, shuffled)),
      DelayedAction(voteDurationSec * 1000, FromStateAction(state => state instanceof VotingState && state.context.gameId === this.context.gameId ? state.finish() : NullAction())),
      EmbedMessage(this.channel, embed)
    ])
  }

  static begin = (context: GameContext, channel: Discord.TextChannel, prompt: Prompt) => new SubmissionState(context, channel, prompt, new Map())
}

/** Submission phase complete; voting stage */
export class VotingState implements GameState {

  constructor(
    readonly context: GameContext,
    readonly channel: Discord.TextChannel,
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
      if (!this.context.config.testMode && submission.user === user) {
        return Send(user, new BasicMessage(`You cannot vote for your own entry`))
      }

      return CompositeAction([
        Send(user, new BasicMessage(`Vote recorded for entry ${entry}: '${submission.submission}', DM again to replace it`)),
        FromStateAction(state => {
          if (state instanceof VotingState && state.context.gameId === this.context.gameId) {
            const newState = state.withVote(user, entry)
            return newState.allVotesIn()
              ? newState.finish()
              : NewState(newState)
          } else {
            return NullAction()
          }
        })
      ])
    }
  }

  allVotesIn = () => this.votes.size === this.submissions.length

  withVote = (user: Discord.User, entry: number) =>
    new VotingState(this.context, this.channel, this.prompt, this.submissions, new Map(this.votes).set(user, entry))

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

    let title = `The votes are in!`
    const sweep = withVotes.find(x => x.voted && x.votes.length === withVotes.length - 1)
    if (sweep) {
      title = title + ` ${sweep.user.username} sweeps the board!`
    } else if (withVotes.every(v => v.voted && v.votes.length === 1)) {
      title = title + ` It's a ${withVotes.length}-way split!`
    }
    
    const resultsMessage = new Discord.MessageEmbed()
      .setTitle(title)
      .setDescription([
        this.prompt,
        ``,
        ...withVotes.map(x => {
          let name = `**${x.user.username}**`
          if (x.voted) {
            name = name + `, with ${x.votes.length} votes`
            if (x.votes.length > 0) {
              name = name + `: ${x.votes.map(v => v.username).join(', ')}`
            }
          } else {
            name = name + `, who didn't vote`
          }
          return `• ${x.submission} (${name})`
        })
      ])


    const newContext = {
      ...this.context,
      scores: this.context.scores.add(Scores.fromRound(withVotes.map(x => [x.user, x.voted ? x.votes.length : 0]))),
      users: deduplicate([...this.context.users, ...withVotes.map(x => x.user)])
    }

    return CompositeAction([
      EmbedMessage(this.channel, resultsMessage),
      endGame(newContext, this.channel)
    ])
  }

  static begin = (context: GameContext, channel: Discord.TextChannel, prompt: Prompt, submissions: Submission[]) =>
    new VotingState(context, channel, prompt, submissions, new Map())
}

function endGame(context: GameContext, channel: Discord.TextChannel) {
  return CompositeAction([
    NewState(new IdleState(context)),
    DelayedAction(5000, FromStateAction(state => state instanceof IdleState ? state.startRound(channel, context.users) : NullAction()))
  ])
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

function deduplicate<A>(array: A[]) {
  return [...new Set(array)]
}