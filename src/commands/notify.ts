import * as Discord from 'discord.js'
import { Case } from '../case'

export const Notify = Case('toggle-notification', (member: Discord.GuildMember, role: Discord.Role, notify: boolean) => ({ member, role, notify }))
