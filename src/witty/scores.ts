import * as Discord from 'discord.js';

import { fold, semigroupSum } from 'fp-ts/lib/Semigroup'
import { Round, RoundScoreView } from './round';
import { memo } from '../util';

const sum = fold(semigroupSum)

export class RoundScore {
  constructor(readonly points: number, readonly available: number) { }

  get score() {
    return this.points * Math.min(this.available/4, 1)
  }
}

export class Score {
  constructor(readonly rounds: Array<RoundScore>) {}

  add(other: Score): Score {
    return new Score([...this.rounds, ...other.rounds])
  }

  get games() {
    return this.rounds.length
  }
  
  get totalPoints() {
    return sum(0, this.rounds.map(x => x.points))
  }

  get totalPossible() {
    return sum(0, this.rounds.map(x => x.available))
  }

  get rating() {
    const totalPoints = sum(0, this.rounds.map(round => round.score))
    return totalPoints / Math.max(this.games, 20)
  }

  get ratio() {
    return (100 * this.totalPoints / this.totalPossible).toFixed(0) + '%'
  }

  get gamesRatio() {
    return (this.totalPoints / this.games).toFixed(2)
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

  mostPoints() {
    let points = 0
    let users: Discord.User[] = []
    for (const [u, s] of this.map.entries()) {
      if (s.totalPoints === points) {
        users.push(u)
      } else if (s.totalPoints > points) {
        users = [u]
        points = s.totalPoints
      }
    }
    return {
      users,
      points
    }
  }

  byRatingDescending = memo(() =>
    Array.from(this.map)
      .filter(([, score]) => score.totalPoints > 0)
      .sort(([, a], [, b]) => b.rating - a.rating))
  
  byPointsDescending = memo(() =>
    Array.from(this.map)
      .filter(([, score]) => score.totalPoints > 0)
      .sort(([, a], [, b]) => b.totalPoints - a.totalPoints))

  static empty(): Scores {
    return new Scores(new Map())
  }

  static fromRounds(rounds: Round[]): Scores {
    return rounds
      .map(round => Scores.fromRound(Array.from(round.submissions.entries()).map(([user, x]) => [user, x.voted ? x.votes.length : 0])))
      .reduce((a, b) => a.add(b), Scores.empty())
  }

  static fromRoundViews(rounds: RoundScoreView[]): Scores {
    return rounds
      .map(round => Scores.fromRoundView(round))
      .reduce((a, b) => a.add(b), Scores.empty())
  }
  
  static fromRound(arr: Array<[Discord.User, number]>): Scores {
    const available = arr.length - 1 // can't self-vote
    return new Scores(new Map(arr.map(([user, points]) => [user, new Score([new RoundScore(points, available)])])))
  }

  static fromRoundView(round: RoundScoreView): Scores {
    const available = round.size - 1
    return new Scores(new Map(round.submissions.map(s => [s.user, new Score([new RoundScore(s.voted ? s.votes.length : 0, available)])])))
  }
}

export type ScoreUnit = 'game' | 'day' | 'week' | 'month' | 'year' | 'alltime'