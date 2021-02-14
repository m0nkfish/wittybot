import * as Discord from 'discord.js'
import { Case } from '../../case'

export const Unnotify = Case('unnotify-me', (member: Discord.GuildMember) => ({ member }))
