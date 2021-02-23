import * as Discord from 'discord.js';
import { Case } from '../../case';
import { MafiaSettings } from '../context';

export const Begin = Case('mafia-begin', (member: Discord.GuildMember, channel: Discord.TextChannel, settings: MafiaSettings) => ({ channel, member, settings, user: member.user }))
