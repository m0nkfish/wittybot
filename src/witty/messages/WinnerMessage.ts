import * as Discord from 'discord.js'

import { Message } from './index'
import { GameContext } from '../context';
import { mention } from './mention';
import { Scores } from '../scores';

export class WinnerMessage implements Message {
  constructor(readonly context: GameContext, readonly score: number, readonly winners: Discord.User[]) {}

  get content() {
    const winner = this.winners.length === 1 ? 'a winner' : `${this.winners.length} winners`

    return new Discord.MessageEmbed()
      .setTitle(`:trophy: After ${this.context.rounds.length} rounds, we have ${winner}!`)
      .setDescription([
        `Congratulations to ${this.winners.map(mention).join(' & ')} for winning the game with ${this.score} points`,
        ``,
        ...Scores.fromRounds(this.context.rounds).byPointsDescending()
          .map(([u, s], i) => `${i+1}. **${s.totalPoints} points**: ${mention(u)}`)
      ])
  }
}