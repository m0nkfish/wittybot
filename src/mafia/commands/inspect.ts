import { Case } from "../../case";
import * as Discord from 'discord.js';

export const Inspect = Case('mafia-inspect', (user: Discord.User) => ({ user }))