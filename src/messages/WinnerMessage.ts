import * as Discord from 'discord.js'

import { Message } from './index'
import { GameContext } from '../context';
import { mention } from './mention';
import { Scores } from '../scores';

export class WinnerMessage implements Message {
  constructor(readonly context: GameContext, readonly score: number, readonly winners: Discord.User[]) {}

  get content() {
    return new Discord.MessageEmbed()
      .setTitle(`:trophy: We have a winner!`)
      .setDescription([
        `Congratulations to ${this.winners.map(mention).join(' & ')} for winning the game with ${this.score} points`,
        ``,
        ...Scores.fromRounds(this.context.rounds).byPointsDescending()
          .map(([u, s], i) => `${i+1}. **${s.totalPoints} points**: ${mention(u)}`)
      ])
  }
}