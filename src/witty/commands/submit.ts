import * as Discord from 'discord.js'
import { Case } from '../../case'

export const Submit = Case('witty-submit', (submission: string, message: Discord.Message) => ({ user: message.author, submission, message }))
