import { Case } from "../../case";
import * as Discord from 'discord.js';

export const Reset = Case('admin-reset', (member: Discord.GuildMember) => ({ member }))