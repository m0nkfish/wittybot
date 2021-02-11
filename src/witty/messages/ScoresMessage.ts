import * as Discord from 'discord.js'
import { Scores } from '../scores';
import { Message, mention } from '../../messages'

export class ScoresByRatingMessage implements Message {
  constructor(readonly scores: Scores, readonly timeframe: string) { }

  positiveScoresInOrder = this.scores.byRatingDescending()

  get content() {
    const emoji = (place: number) =>
      place === 0 ? ':first_place: '
      : place === 1 ? ':second_place: '
      : place === 2 ? ':third_place: '
      : ''

    const description =
      this.positiveScoresInOrder.length === 0
        ? [`Nobody has scored! Start a game with \`!witty\``]
        : this.positiveScoresInOrder.slice(0, 15).flatMap(([user, score], i) => [
          `${i + 1}. ${emoji(i)}${mention(user)}: **${score.rating.toFixed(2)}**`,
          `${score.totalPoints} points/${score.totalPossible} possible; ${score.games} rounds; ${score.gamesRatio} points per round`,
          ``
        ])

    return new Discord.MessageEmbed()
      .setTitle(`:trophy: Scores ${this.timeframe}`)
      .setDescription(description)
      .addField('Current rating formula', `\`\`\`score_per_round = points_score * min(points_available / 4, 1)\ntotal_score = score_per_round / max(rounds_played, 20)\`\`\``)
  }
}

export class ScoresByPointsMessage implements Message {
  constructor(readonly scores: Scores) { }

  get content() {
    return new Discord.MessageEmbed()
      .setTitle(`Scores so far...`)
      .setDescription(
        this.scores.byPointsDescending()
          .map(([u, s], i) => `${i + 1}. **${s.totalPoints} points**: ${mention(u)}`)
      )
  }
}
