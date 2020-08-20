import * as Discord from 'discord.js'
import { Score, Scores } from './scores';
import { Prompt } from './prompts';
import { AnyGameState, SubmissionState, VotingState } from './state';
import { Id } from './id';
import { shuffle } from 'random-js';
import { mt } from './random';

export type Destination = Discord.TextChannel | Discord.User

export interface Message {
  content: string | Discord.MessageAdditions
  onSent?: (msg: Discord.Message, getState: () => AnyGameState) => void
}

export class BasicMessage implements Message {
  constructor(readonly content: string) { }
}

export class ReleaseMessage implements Message {
  constructor(readonly testMode: boolean) { }

  get content() {
    let title = 'Bot restarted/redeployed'
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
      .setTitle('Wittybot help')
      .setDescription(`Wittybot is a simple, fast-paced text game where you submit text answers to prompts, then vote for the funniest one.`)
      .addField('How to play', [
        `1. Someone starts a game with the \`!witty\` command`,
        `2. The bot sends a prompt to the channel`,
        `3. Players have a certain amount of time to submit the funniest thing they can think of (either DM the bot or use \`||spoiler||\` tags in-channel)`,
        `4. After submissions are in and the time's up, players vote for the funniest entry`,
        `5. Repeat ad infinitum (or until there aren't enough players)`
      ])
      .addField('Commands', [
        `\`!help\` - you're looking at it`,
        `\`!witty [timeout]\` - start a new game. timeout is the number of seconds per round (defaults to 60)`,
        `\`!skip\` - skip the current prompt`,
        `\`!notify\` - be notified when a new game starts`,
        `\`!unnotify\` - stop being notified when a new game starts`
      ])
  }
}

export class NewRoundMessage implements Message {
  constructor(
    readonly roundId: Id,
    readonly prompt: Prompt,
    readonly botUser: Discord.User,
    readonly submitDurationSec: number
  ) { }

  private readonly baseContent = new Discord.MessageEmbed()
    .setTitle('A new round begins! Complete the prompt')
    .setDescription([
      this.prompt.formatted,
      ``,
      `Submit by DMing the bot (:point_up: on desktop just click the sender name)\n**or** by using \`/spoiler <submission>\` in this channel (your message will be deleted)`])
  
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

export class GameStartedMessage extends BasicMessage {
  constructor(notifyRole: Discord.Role, startedBy: Discord.User) {
    super(`Calling all <@&${notifyRole.id}>! (:point_left: type !notify if you want to be in this group) A new game was started by <@${startedBy.id}>`)
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
    .setTitle(`Time's up!`)
    .setDescription([
      this.prompt.formatted,
      ``,
      ...this.submissions.map((x, i) => `${i + 1}. ${x.submission}`),
      ``,
      `Vote for your favourite by DMing the bot with the entry number\n**or** by using \`/spoiler <entry number>\` in this channel`
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

  get content() {
    let title = `The votes are in!`
    const sweep = this.withVotes.find(x => x.voted && x.votes.length === this.withVotes.length - 1)
    if (sweep) {
      title = title + ` ${sweep.user.username} sweeps the board!`
    } else if (this.withVotes.every(v => v.voted && v.votes.length === 1)) {
      title = title + ` It's a ${this.withVotes.length}-way split!`
    }

    return new Discord.MessageEmbed()
      .setTitle(title)
      .setDescription([
        this.prompt.formatted,
        ``,
        ...this.withVotes.map(x => {
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
      .setTitle(`Scores ${this.timeframe}`)
      .setDescription(description)
      .addFields(this.positiveScoresInOrder.slice(0, 25).map(([user, score], i) => ({
        name: `${i + 1}. ${emoji(i)}${user.username} with a rating of ${score.rating.toFixed(2)}`,
        value: `${score.totalPoints} points of a possible ${score.totalPossible} (${score.ratio}), over ${score.games} games`
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
    const message = new Discord.MessageEmbed()
      .setTitle(`Vote recorded for entry ${this.entry}`)
      .setDescription([
        this.prompt.formatted,
        ``,
        this.submission
      ])
      .setFooter(`Message again to replace your vote`)

    return message
  }
}