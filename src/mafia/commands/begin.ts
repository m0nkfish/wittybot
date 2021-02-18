import * as Discord from 'discord.js';
import { Case } from '../../case';
import { MafiaSettings } from '../context';

export const Begin = Case('mafia-begin', (user: Discord.User, channel: Discord.TextChannel, settings: MafiaSettings) => ({ channel, user, settings }))
