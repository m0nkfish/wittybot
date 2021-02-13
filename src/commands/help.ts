import * as Discord from 'discord.js'
import { Case } from '../case'

export const Help = Case('help', (source: Discord.User | Discord.TextChannel) => ({ source }))