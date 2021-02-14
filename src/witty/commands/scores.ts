import * as Discord from 'discord.js'
import { Case } from '../../case'
import { ScoreUnit } from '../scores';

export const GetScores = Case('witty-scores', (source: Discord.TextChannel, unit: ScoreUnit) => ({ source, unit }))
