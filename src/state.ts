import * as Discord from 'discord.js'
import { Command, Begin, Submit, Vote, Skip } from './commands';
import { Action, CompositeAction, NewState, DelayedAction, EmbedMessage, FromStateAction, NullAction, Message, UpdateState } from './actions';
import { choosePrompt } from './prompts';
import { shuffle, uuid4 } from 'random-js';
import { mt } from './random';
import { Context } from './context';
import { Scores } from './scores';

type Prompt = string
type Submission = { user: Discord.User, submission: string }

export type GameState = {
  interpreter(message: Discord.Message): Command | null
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
      : null

  receive(command: Command): Action | undefined {
    if (command.type === 'begin') {
      return this.startRound(command.channel)
    }
  }

  startRound = (channel: Discord.TextChannel) => {
    const prompt = choosePrompt()
    const embed = new Discord.MessageEmbed()
      .setTitle('A new round begins!')
      .setDescription([
        `Complete the following sentence:`,
        `**${prompt}**`,
        `You have ${this.context.config.submitDurationSec} seconds to come up with an answer; submit by DMing <@${this.context.client.user?.id}>`
      ].join('\n'))

    const gameId = uuid4(mt)

    return CompositeAction([
      NewState(SubmissionState.begin({ ...this.context, gameId }, channel, prompt)),
      DelayedAction(this.context.config.submitDurationSec * 1000, FromStateAction(state => state instanceof SubmissionState && state.context.gameId === gameId ? state.finish() : NullAction())),
      EmbedMessage(channel, embed)
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
    return null
  }

  receive(command: Command): Action | undefined {
    if (command.type === 'submit') {
      const messages: Action[] = []
      if (this.submissions.has(command.user)) {
        messages.push(Message(command.user.dmChannel, `Replacement submission accepted`))
      } else {
        messages.push(Message(command.user.dmChannel, `Submission accepted`))
        messages.push(Message(this.channel, `Submission received from <@${command.user.id}>`))
      }
      return CompositeAction([
        ...messages,
        UpdateState(state => state instanceof SubmissionState ? state.withSubmission(command.user, command.submission) : state),
      ])
    } else if (command.type === 'skip') {
      if (this.submissions.size === 0) {
        return CompositeAction([
          Message(command.channel, `Skipping this prompt`),
          endGame(this.context, this.channel)
        ])
      } else {
        return Message(command.channel, `Prompt already has submissions; won't skip`)
      }
    }
  }

  withSubmission = (user: Discord.User, submission: string) =>
    new SubmissionState(this.context, this.channel, this.prompt, new Map(this.submissions).set(user, submission))

  finish = (): Action => {
    if (!this.context.config.testMode && this.submissions.size < 3) {
      return CompositeAction([
        Message(this.channel, `Not enough submissions to continue`),
        NewState(new IdleState(this.context))
      ])
    }

    const shuffled = shuffle(mt, Array.from(this.submissions).map(([user, submission]) => ({ user, submission })))

    const voteDurationSec = this.submissions.size * 10

    const embed = new Discord.MessageEmbed()
      .setTitle(`Time's up!`)
      .setDescription([
        `Vote for your favourite by DMing <@${this.context.client.user?.id}> with the entry number. You have ${voteDurationSec} seconds`,
        ``,
        `Complete the following sentence:`,
        `**${this.prompt}**`,
        ``,
        ...shuffled.map((x, i) => `${i + 1}. ${x.submission}`)
      ].join('\n'))

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
    return null
  }

  receive(command: Command): Action | undefined {
    if (command.type === 'vote') {
      const { entry, user } = command
      if (entry < 1 || this.submissions.length < entry) {
        return Message(user.dmChannel, `You must vote between 1 and ${this.submissions.length}`)
      }

      if (!this.submissions.some(x => x.user === user)) {
        return Message(user.dmChannel, `You must have submitted an entry in order to vote`)
      }

      const submission = this.submissions[entry - 1]
      if (!submission) {
        return
      }
      if (!this.context.config.testMode && submission.user === user) {
        return Message(user.dmChannel, `You cannot vote for your own entry`)
      }

      return CompositeAction([
        Message(user.dmChannel, `Vote recorded for entry ${entry}: '${submission.submission}'`),
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
    
    const resultsMessage = new Discord.MessageEmbed()
      .setTitle(`The votes are in!`)
      .setDescription([
        `Complete the following sentence:`,
        `**${this.prompt}**`,
        ...withVotes.map(x => {
          let name = x.user.username
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
      scores: this.context.scores.add(new Scores(new Map(withVotes.map(x => [x.user, x.voted ? x.votes.length : 0]))))
    }

    const scoresMessage = new Discord.MessageEmbed()
      .setTitle(`Scores on the doors...`)
      .setDescription(
        `The scores (since the bot was last restarted!) are:\n` +
        newContext.scores.inOrder()
          .map(([user, score]) => `${score} points: ${user.username}`)
          .join('; '))

    return CompositeAction([
      EmbedMessage(this.channel, resultsMessage),
      EmbedMessage(this.channel, scoresMessage),
      endGame(newContext, this.channel)
    ])
  }

  static begin = (context: GameContext, channel: Discord.TextChannel, prompt: Prompt, submissions: Submission[]) =>
    new VotingState(context, channel, prompt, submissions, new Map())
}

function endGame(context: Context, channel: Discord.TextChannel) {
  return !context.config.autoRun
    ? NewState(new IdleState(context))
    : CompositeAction([
      NewState(new IdleState(context)),
      DelayedAction(1000, FromStateAction(state => state instanceof IdleState ? state.startRound(channel) : NullAction()))
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