import * as Discord from 'discord.js';
import { Case } from '../case';

export const In = Case('in', (member: Discord.GuildMember) => ({ member }))
