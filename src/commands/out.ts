import * as Discord from 'discord.js';
import { Case } from '../case';

export const Out = Case('out', (member: Discord.GuildMember) => ({ member }))
