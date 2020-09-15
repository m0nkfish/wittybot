import * as Discord from 'discord.js'
import {  Scores } from './scores';
import { Prompt } from './prompts';
import { AnyGameState, SubmissionState, VotingState } from './state';
import { Id } from './id';
import { shuffle } from 'random-js';
import { mt } from './random';
import { pairs, arrayEq } from './util';
import { StartingState } from './state/StartingState';

export type Destination = Discord.TextChannel | Discord.User

export interface Message {
  content: string | Discord.MessageEmbed | { content: string, embed: Discord.MessageEmbed }
  onSent?: (msg: Discord.Message, getState: () => AnyGameState) => void
}

export class BasicMessage implements Message {
  constructor(readonly content: string) { }
}

export class ReleaseMessage implements Message {
  constructor(readonly testMode: boolean) { }

  get content() {
    let title = ':robot: Bot restarted/redeployed'
    if (this.testMode) {
      title += ' (test mode)'
    }

    return new Discord.MessageEmbed()
      .setTitle(title)
  }
}

export class HelpMessage implements Message {
  constructor() { }

  get content() {
    return new Discord.MessageEmbed()
      .setTitle(':information_source: Wittybot help')
      .setDescription(`Wittybot is a simple, fast-paced text game where you submit text answers to prompts, then vote for the funniest one.`)
      .addField('How to play', [
        `1. Someone starts a game with the \`!witty\` command`,
        `2. The bot sends a prompt to the channel`,
        `3. Players have a certain amount of time to submit the funniest thing they can think of (either DM the bot or use \`||spoiler||\` tags in-channel)`,
        `4. After submissions are in and the time's up, players vote for the funniest entry`,
        `5. Repeat ad infinitum (or until there aren't enough players)`
      ])
      .addField('Commands', HelpMessage.commands.map(([command, description]) => `\`!${command}\` - ${description}`))
      .setFooter(`This incarnation of wittybot was brought to you by monkfish#4812`)
  }

  static commands = [
    ['help', "you're looking at it"],
    ['witty [timeout]', "start a new game. timeout is the number of seconds per round (defaults to 60)"],
    ['in', "register your interest when a game begins"],
    ['skip', "skip the current prompt"],
    ['notify', "be notified when a new game starts"],
    ['unnotify', "stop being notified when a new game starts"],
    ['scores [day|week|month|year|alltime]', "show the scores from this server (defaults to day)"]
  ] as const
}

export class NewRoundMessage implements Message {
  constructor(
    readonly roundId: Id,
    readonly prompt: Prompt,
    readonly botUser: Discord.User,
    readonly submitDurationSec: number
  ) { }

  private readonly baseContent = new Discord.MessageEmbed()
    .setTitle(this.prompt.formatted)
    .setDescription([
      `Submit by sending a spoiler message (\`||whatever||\`, or \`/spoiler whatever\` on desktop) to this channel`,
      `**or** by DMing the bot (:point_up: on desktop just click the sender name)`
    ])
  
  private message = (remainingSec: number) =>
    this.baseContent
      .setFooter(`You have ${remainingSec} seconds to come up with an answer`)

  get content() {
    return this.message(this.submitDurationSec)
  }

  onSent = (msg: Discord.Message, getState: () => AnyGameState) => {
    let remainingSec = this.submitDurationSec
    const interval = setInterval(() => {
      remainingSec -= 5
      const state = getState()
      if (remainingSec > 0 && state instanceof SubmissionState && state.context.roundId.eq(this.roundId)) {
        msg.edit(this.message(remainingSec))
      } else {
        clearInterval(interval)
        msg.edit(this.baseContent.setFooter(`Time's up!`))
      }
    }, 5000)
  }
}

export class GameStartedMessage implements Message {
  constructor(readonly notifyRole: Discord.Role | undefined, readonly startedBy: Discord.User, readonly gameId: Id) {
  }

  get content() {
    return this.message([this.startedBy])
  }

  message(interested: Discord.User[]) {
    const embed = new Discord.MessageEmbed()
      .setTitle(`:rotating_light: The game is afoot!`)
      .setDescription(`A new game was started by ${mention(this.startedBy)}; type \`!in\` to register interest. Once three people are interested, the game will begin (expires in 5 minutes)`)
      .setFooter(`In: ${interested.map(x => x.username).join(', ')}`)

    return this.notifyRole
      ? {
        content: `Calling all ${mention(this.notifyRole)}! (:point_left: type \`!notify\` if you want to be in this group)`,
        embed
      }
      : embed
  }

  onSent = (msg: Discord.Message, getState: () => AnyGameState) => {
    let remainingSec = StartingState.StartingStateDelayMs / 1000
    const interval = setInterval(() => {
      remainingSec -= 5
      const state = getState()
      if (remainingSec > 0 && state instanceof StartingState && state.context.gameId === this.gameId) {
        msg.edit(this.message(state.interested))
      } else {
        clearInterval(interval)
      }
    }, 5000)
  }
}

export class VoteMessage implements Message {
  constructor(
    readonly roundId: Id,
    readonly prompt: Prompt,
    readonly submissions: Array<{ user: Discord.User, submission: string }>,
    readonly botUser: Discord.User,
    readonly voteDurationSec: number) {
      this.users = [...submissions.map(x => x.user)]
      shuffle(mt, this.users)
    }


  private readonly users: Discord.User[]

  private readonly baseContent = new Discord.MessageEmbed()
    .setTitle(`:timer: Time's up!`)
    .setDescription([
      this.prompt.formatted,
      ``,
      ...this.submissions.map((x, i) => `${i + 1}. ${x.submission}`),
      ``,
      `Vote for your favourite by sending a spoiler message to this channel`,
      `**or** by DMing the bot with the entry number`
    ])

  private message = (remainingSec: number, voters: Discord.User[]) => 
    this.baseContent
      .setFooter(`You have ${remainingSec} seconds. Still left to vote: ${this.users.filter(u => !voters.some(v => v == u)).map(u => u.username).join(', ')}`)

  get content() {
    return this.message(this.voteDurationSec, [])
  }

  onSent = (msg: Discord.Message, getState: () => AnyGameState) => {
    let remainingSec = this.voteDurationSec
    const interval = setInterval(() => {
      remainingSec -= 5
      const state = getState()
      if (remainingSec > 0 && state instanceof VotingState && state.context.roundId.eq(this.roundId)) {
        msg.edit(this.message(remainingSec, Array.from(state.votes.keys())))
      } else {
        clearInterval(interval)
        msg.edit(this.baseContent.setFooter(`Voting over!`))
      }
    }, 5000)
  }
}

export class VotingFinishedMessage implements Message {
  constructor(
    readonly prompt: Prompt,
    readonly withVotes: Array<{ user: Discord.User, votes: Discord.User[], voted: boolean, submission: string }>) {}

  sweep(): Discord.User | undefined {
    const sweep = this.withVotes.find(x => x.voted && x.votes.length === this.withVotes.length - 1)
    if (sweep) {
      return sweep.user
    }
  }
  
  split(): number | undefined {
    if (this.withVotes.every(v => v.voted && v.votes.length === 1)) {
      return this.withVotes.length
    }
  }

  pals(): [Discord.User, Discord.User] | undefined {
    for (const [a, b] of pairs(this.withVotes)) {
      if (arrayEq(a.votes, [b.user]) && arrayEq([a.user], b.votes)) {
        return [a.user, b.user]
      }
    }
  }

  get content() {
    let title = `The votes are in!`
    const sweep = this.sweep()
    const split = this.split()
    const pals = this.pals()
    if (sweep) {
      title = title + ` :trophy: ${sweep.username} sweeps the board!`
    } else if (split) {
      title = title + ` :bowling: It's a ${this.withVotes.length}-way split!`
    } else if (pals) {
      title = title + ` :revolving_hearts: ${pals[0].username} and ${pals[1].username} sitting in a tree, V-O-T-I-N-G (for each other)`
    }

    return new Discord.MessageEmbed()
      .setTitle(title)
      .setDescription([
        this.prompt.formatted,
        ``,
        ...this.withVotes.map(x => {
          let name = mention(x.user)
          if (x.voted) {
            name = name + `, with ${x.votes.length} votes`
            if (x.votes.length > 0) {
              name = name + `: ${x.votes.map(mention).join(', ')}`
            }
          } else {
            name = name + `, who didn't vote`
          }
          return `• ${x.submission} (${name})`
        })
      ])
  }
}

export class ScoresMessage implements Message {
  constructor(readonly scores: Scores, readonly timeframe: string) {}

  positiveScoresInOrder = Array.from(this.scores.map)
    .sort(([, a], [, b]) => b.rating - a.rating)
    .filter(([, score]) => score.totalPoints > 0)

  get content() {
    const description =
      this.positiveScoresInOrder.length === 0
        ? `Nobody has scored! Start a game with \`!witty\``
        : `Current rating formula: \`\`\`score_per_round = points_score * min(points_available / 4, 1)\ntotal_score = score_per_round / max(games_played, 20)\`\`\``

    const emoji = (place: number) =>
      place === 0 ? ':first_place: '
      : place === 1 ? ':second_place: '
      : place === 2 ? ':third_place: '
      : ''

    return new Discord.MessageEmbed()
      .setTitle(`:trophy: Scores ${this.timeframe}`)
      .setDescription(description)
      .addFields(this.positiveScoresInOrder.slice(0, 25).map(([user, score], i) => ({
        name: `${i + 1}. ${emoji(i)}${mention(user)} with a rating of ${score.rating.toFixed(2)}`,
        value: `${score.totalPoints} points of a possible ${score.totalPossible} (${score.ratio}), over ${score.games} games (${score.gamesRatio} points per game)`
      })))
  }
}

export class SubmissionAcceptedMessage implements Message {
  constructor(readonly prompt: Prompt, readonly submission: string, readonly isReplacement: boolean) { }

  get content() {
    const message = new Discord.MessageEmbed()
      .setTitle(this.isReplacement ? `Replacement submission accepted` : `Submission accepted`)
      .setDescription([
        this.prompt.formatted,
        ``,
        this.submission
      ])
      .setFooter(`Submit again to replace this submission`)

    return message
  }
}

export class VoteAcceptedMessage implements Message {
  constructor(readonly prompt: Prompt, readonly entry: number, readonly submission: string) { }

  get content() {
    return new Discord.MessageEmbed()
      .setTitle(`Vote recorded for entry ${this.entry}`)
      .setDescription([
        this.prompt.formatted,
        ``,
        this.submission
      ])
      .setFooter(`Message again to replace your vote`)
  }
}

export function mention(entity: Discord.User | Discord.Role) {
  return entity instanceof Discord.Role ? `<@&${entity.id}>` : `<@${entity.id}>`
}