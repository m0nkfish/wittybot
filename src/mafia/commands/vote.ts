import { Case } from "../../case";
import * as Discord from 'discord.js';

export const Vote = Case('mafia-vote', (user: Discord.User) => ({ user }))