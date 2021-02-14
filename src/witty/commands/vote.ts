import * as Discord from 'discord.js'
import { Case } from '../../case'

export const Vote = Case('witty-vote', (entry: number, message: Discord.Message) => ({ user: message.author, entry, message }))
