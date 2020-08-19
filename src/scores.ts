import * as Discord from 'discord.js';
import { Send } from './actions';
import { ScoresMessage } from './messages';
import { Round } from './context';
import { fold, semigroupSum } from 'fp-ts/lib/Semigroup'
const sum = fold(semigroupSum)


export class Score {
  constructor(readonly rounds: Array<{ points: number, available: number }>) {}

  add(other: Score): Score {
    return new Score([...this.rounds, ...other.rounds])
  }

  get games() {
    return this.rounds.length
  }
  
  get points() {
    return sum(0, this.rounds.map(x => x.points))
  }

  get ofPossible() {
    return sum(0, this.rounds.map(x => x.available))
  }

  get rating() {
    // games played modifier caps at 20
    return Math.min(20, this.games) * this.points / this.ofPossible
  }

  get ratio() {
    return (100 * this.points / this.ofPossible).toFixed(0) + '%'
  }

  static empty(): Score {
    return new Score([])
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

  static fromRounds(rounds: Round[]): Scores {
    return rounds
      .map(round => Scores.fromRound(Array.from(round.submissions.entries()).map(([user, x]) => [user, x.voted ? x.votes.length : 0])))
      .reduce((a, b) => a.add(b), Scores.empty())
  }

  show(channel: Discord.TextChannel | Discord.User) {
    const positiveScoresInOrder = this.inOrder()
      .filter(([, score]) => score.points > 0)

    return Send(channel, new ScoresMessage(positiveScoresInOrder))
  }

  static fromRound(arr: Array<[Discord.User, number]>): Scores {
    const available = arr.length - 1 // can't self-vote
    return new Scores(new Map(arr.map(([user, points]) => [user, new Score([{ points, available }])])))
  }
}