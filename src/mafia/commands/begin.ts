import * as Discord from 'discord.js'
import { Case } from '../../case'

export const Begin = Case('mafia-begin', (user: Discord.User, channel: Discord.TextChannel) => ({ channel, user }))
