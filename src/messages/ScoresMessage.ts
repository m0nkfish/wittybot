import * as Discord from 'discord.js'
import { Scores } from '../scores';
import { Message, mention } from './index'

export class ScoresMessage implements Message {
  constructor(readonly scores: Scores, readonly timeframe: string) { }

  positiveScoresInOrder = this.scores.byRatingDescending()

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
      .setDescription([
        ...this.positiveScoresInOrder.slice(0, 15).flatMap(([user, score], i) => [
          `${i + 1}. ${emoji(i)}${mention(user)} with a rating of **${score.rating.toFixed(2)}**`,
          `${score.totalPoints} points of a possible ${score.totalPossible} (${score.ratio}), over ${score.games} games (${score.gamesRatio} points per game)`,
          ``
        ]),
        description
      ])
      .addFields()
  }
}
