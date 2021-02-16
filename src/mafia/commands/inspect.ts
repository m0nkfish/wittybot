import { Case } from "../../case";
import * as Discord from 'discord.js';

export const Track = Case('mafia-track', (user: Discord.User, target: Discord.User) => ({ user, target }))