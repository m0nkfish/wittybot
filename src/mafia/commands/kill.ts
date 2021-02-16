import { Case } from "../../case";
import * as Discord from 'discord.js';

export const Kill = Case('mafia-kill', (user: Discord.User, target: Discord.User) => ({ user, target }))