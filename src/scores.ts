import * as Discord from 'discord.js';
import { EmbedMessage } from './actions';

export class Score {
  constructor(readonly points: number, readonly ofPossible: number) {}

  add(other: Score): Score {
    return new Score(this.points + other.points, this.ofPossible + other.ofPossible)
  }

  get ratio() {
    return this.points / this.ofPossible
  }

  static empty(): Score {
    return new Score(0, 0)
  }
}

export class Scores {

  constructor(readonly map: Map<Discord.User, Score>) { }

  add(other: Scores) {
    const map = new Map(this.map)
    other.map.forEach((count, user) => {
      const base = map.get(user) ?? Score.empty()
      map.set(user, base.add(count))
    })
    return new Scores(map)
  }

  inOrder() {
    return Array.from(this.map).sort(([, a], [, b]) => b.ratio - a.ratio)
  }

  static empty(): Scores {
    return new Scores(new Map())
  }

  show(channel: Discord.TextChannel | Discord.DMChannel) {
    const positiveScoresInOrder = this.inOrder()
      .filter(([, score]) => score.points > 0)
      .map(([user, score]) => `${score.points}/${score.ofPossible} points: ${user.username}`)

    const description = 
      positiveScoresInOrder.length === 0
        ? `Nobody has scored since the bot was last restarted (start a game with the **!witty** command)`
        : `The scores (since the bot was last restarted!) are:\n` + positiveScoresInOrder.join('\n')

    return EmbedMessage(channel, new Discord.MessageEmbed()
      .setTitle(`Scores on the doors...`)
      .setDescription(description))
  }

  static fromRound(arr: Array<[Discord.User, number]>): Scores {
    const available = arr.length - 1 // can't self-vote
    return new Scores(new Map(arr.map(([user, points]) => [user, new Score(points, available)])))
  }
}