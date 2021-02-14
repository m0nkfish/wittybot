import * as Discord from 'discord.js'
import { Case } from '../../case'

export const Notify = Case('notify-me', (member: Discord.GuildMember) => ({ member }))
