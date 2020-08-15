import * as Discord from 'discord.js';
import { Send } from './actions';
import { ScoresMessage } from './messages';

export class Score {
  constructor(readonly points: number, readonly ofPossible: number, readonly games: number) {}

  add(other: Score): Score {
    return new Score(this.points + other.points, this.ofPossible + other.ofPossible, this.games + other.games)
  }

  get rating() {
    // games played modifier caps at 20
    return Math.min(20, this.games) * this.points / this.ofPossible
  }

  get ratio() {
    return (100 * this.points / this.ofPossible).toFixed(0) + '%'
  }

  static empty(): Score {
    return new Score(0, 0, 0)
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
    return Array.from(this.map).sort(([, a], [, b]) => b.rating - a.rating)
  }

  static empty(): Scores {
    return new Scores(new Map())
  }

  show(channel: Discord.TextChannel | Discord.User) {
    const positiveScoresInOrder = this.inOrder()
      .filter(([, score]) => score.points > 0)

    return Send(channel, new ScoresMessage(positiveScoresInOrder))
  }

  static fromRound(arr: Array<[Discord.User, number]>): Scores {
    const available = arr.length - 1 // can't self-vote
    return new Scores(new Map(arr.map(([user, points]) => [user, new Score(points, available, 1)])))
  }
}