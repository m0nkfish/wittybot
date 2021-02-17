import * as Discord from 'discord.js';
import { Case } from '../case'

export const In = Case('interested', (member: Discord.GuildMember) => ({ member }))
