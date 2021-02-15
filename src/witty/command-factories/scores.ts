import * as Discord from 'discord.js'
import { CommandFactory } from '../../commands';
import { ScoreUnit } from '../scores';
import { WittyGameContext } from '../context';
import { GetScores } from '../commands';
import { MessageReceived } from '../../discord-events';

export const GetScoresFactory = () => CommandFactory.build.event(MessageReceived).process(((state, {message}) => {
  if (message.channel instanceof Discord.TextChannel) {
    const scores = /^!scores(?: (game|day|week|month|year|alltime))?$/.exec(message.content)
    if (scores) {
      const unit = (scores[1] ?? (state.context instanceof WittyGameContext ? 'game' : 'month')) as ScoreUnit
      return GetScores(message.channel, unit)
    }
  }
}))