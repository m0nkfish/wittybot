import * as Discord from 'discord.js';
import { MafiaRoleCommandFactory } from './commands/all';

export type PlayerIntention = {
  action: MafiaRoleCommandFactory
  target: Discord.User
}

export class PlayerIntentions {
  constructor(readonly intentions: Map<Discord.User, PlayerIntention>) {}

  getIntention = (user: Discord.User) =>
    this.intentions.get(user)

  withIntention = (user: Discord.User, intention: PlayerIntention) =>
    new PlayerIntentions(new Map(this.intentions).set(user, intention))
  
}