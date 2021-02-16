import { Case } from "../../case";
import * as Discord from 'discord.js';

export const Distract = Case('mafia-distract', (user: Discord.User, target: Discord.User) => ({ user, target }))