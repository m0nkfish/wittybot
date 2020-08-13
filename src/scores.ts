import * as Discord from 'discord.js';
import { EmbedMessage } from './actions';

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

  show(channel: Discord.TextChannel | Discord.DMChannel) {
    const positiveScoresInOrder = this.inOrder()
      .filter(([, score]) => score.points > 0)

    const description = 
      positiveScoresInOrder.length === 0
        ? `Nobody has scored since the bot was last restarted (start a game with the **!witty** command)`
        : [`Current rating formula: \`min(20, games played) * total points scored / total points available\``]

    return EmbedMessage(channel, new Discord.MessageEmbed()
      .setTitle(`Scores on the doors...`)
      .setDescription(description)
      .addFields(positiveScoresInOrder.slice(0, 25).map(([user, score], i) => ({
        name: `${i+1}. ${user.username} with a rating of ${score.rating}`,
        value: `${score.points} points of a possible ${score.ofPossible} (${score.ratio}), over ${score.games}`
      }))))
  }

  static fromRound(arr: Array<[Discord.User, number]>): Scores {
    const available = arr.length - 1 // can't self-vote
    return new Scores(new Map(arr.map(([user, points]) => [user, new Score(points, available, 1)])))
  }
}

function renderTable(scores: [Discord.User, Score][]): string {
  return asciiTable([
    ["User", "Games played", "Points scored", "Ratio"],
    ...scores.map(([user, score]) => [user.username, score.games.toString(), score.points.toString(), score.ratio])
  ], true)
}

function asciiTable(rows: string[][], firstRowHeader: boolean): string {
  const columnWidths = rows.reduce((acc, row) => acc.map((n, i) => Math.max(n, row[i].length)), rows[0].map(_ => 0))

  return [
    `+${columnWidths.map(w => '-'.repeat(w + 2)).join('+')}+`,
    ...rows.map((r, i) => {
      const row = `|${r.map((v, j) => ` ${v.padEnd(columnWidths[j], ' ')} `).join('|')}|`
      if (i === 0 && firstRowHeader) {
        const border = `+${columnWidths.map(w => '-'.repeat(w + 2)).join('+')}+`
        return row + '\n' + border
      }
      return row
    }),
    `+${columnWidths.map(w => '-'.repeat(w + 2)).join('+')}+`
    ]
    .join('\n')
}