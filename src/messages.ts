import * as Discord from 'discord.js'
import { Score } from './scores';
import { Prompt } from './prompts';
import { AnyGameState } from './state';

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
        `3. Players have a certain amount of time to DM the bot a submission completing the prompt with the funniest thing they can think of`,
        `4. After submissions are in and the time's up, players DM the bot their vote for the funniest entry`,
        `5. Repeat ad infinitum`
      ])
      .addField('Commands', [
        `\`!help\` - you're looking at it`,
        `\`!witty\` - start a new game`,
        `\`!skip\` - skip the current prompt`,
        `\`!notify\` - be notified when a new game starts`,
        `\`!unnotify\` - stop being notified when a new game starts`,
        `\`!scores\` - view the scoreboard`
      ])
  }
}

export class NewRoundMessage implements Message {
  constructor(
    readonly prompt: Prompt,
    readonly botUser: Discord.User,
    readonly submitDurationSec: number
  ) { }

  private readonly baseContent = new Discord.MessageEmbed()
    .setTitle('A new round begins! Complete the prompt')
    .setDescription([
      this.prompt.formatted,
      ``,
      `Submit by DMing <@${this.botUser.id}> (:point_left: on desktop just click here)`])
  
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
      if (remainingSec <= 0) {
        clearInterval(interval)
        msg.edit(this.baseContent.setFooter(`Time's up!`))
      } else {
        msg.edit(this.message(remainingSec))
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
    readonly prompt: Prompt,
    readonly submissions: Array<{ user: Discord.User, submission: string }>,
    readonly botUser: Discord.User,
    readonly voteDurationSec: number) {}

  get content() {
    return new Discord.MessageEmbed()
      .setTitle(`Time's up!`)
      .setDescription([
        this.prompt.formatted,
        ``,
        ...this.submissions.map((x, i) => `${i + 1}. ${x.submission}`),
        ``,
        `Vote for your favourite by DMing <@${this.botUser.id}> with the entry number`
      ])
      .setFooter(`You have ${this.voteDurationSec} seconds`)
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
  constructor(readonly positiveScoresInOrder: Array<[Discord.User, Score]>) {}

  get content() {
    const description =
      this.positiveScoresInOrder.length === 0
        ? `Nobody has scored since the bot was last restarted (start a game with the **!witty** command)`
        : [`Current rating formula: \`min(20, games played) * total points scored / total points available\``]

    const emoji = (place: number) =>
      place === 0 ? ':first_place: '
      : place === 1 ? ':second_place: '
      : place === 2 ? ':third_place: '
      : ''

    return new Discord.MessageEmbed()
      .setTitle(`Scores on the doors...`)
      .setDescription(description)
      .addFields(this.positiveScoresInOrder.slice(0, 25).map(([user, score], i) => ({
        name: `${i + 1}. ${emoji(i)}${user.username} with a rating of ${score.rating.toFixed(2)}`,
        value: `${score.points} points of a possible ${score.ofPossible} (${score.ratio}), over ${score.games} games`
      })))
  }
}