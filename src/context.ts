import * as Discord from 'discord.js';
import { Scores } from './scores';

export type Context = {
  client: Discord.Client
  scores: Scores
  config: {
    submitDurationSec: number
    testMode?: boolean
    autoRun?: boolean
  }
}
