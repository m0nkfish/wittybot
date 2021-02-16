import { Case } from "../../case";
import * as Discord from 'discord.js';

export const Protect = Case('mafia-protect', (user: Discord.User, target: Discord.User) => ({ user, target }))