import * as Discord from 'discord.js';
import { Case } from '../case'

export const Out = Case('uninterested', (member: Discord.GuildMember) => ({ member }))
