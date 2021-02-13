import * as Discord from 'discord.js'
import { Case } from '../../case'
import { CommandFactory } from '../../command';
import { ScoreUnit } from '../scores';
import { WittyGameContext } from '../context';

export const GetScores = Case('witty-scores', (source: Discord.TextChannel, unit: ScoreUnit) => ({ source, unit }))

export const GetScoresFactory = new CommandFactory((state, message) => {
  if (message.channel instanceof Discord.TextChannel) {
    const scores = /^!scores(?: (game|day|week|month|year|alltime))?$/.exec(message.content)
    if (scores) {
      const unit = (scores[1] ?? (state.context instanceof WittyGameContext ? 'game' : 'month')) as ScoreUnit
      return GetScores(message.channel, unit)
    }
  }
})