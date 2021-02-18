import * as Discord from 'discord.js';
import { MafiaRoleCommandFactory } from '../commands';
import { Role } from './Role';

export class Player {
  constructor(
    readonly user: Discord.User,
    readonly role: Role,
    readonly isAlive: boolean,
  ) {
  }

  canPerform(action: MafiaRoleCommandFactory) {
    return this.isAlive && this.role.commands.day === action || this.role.commands.night === action
  }

  kill() {
    return new Player(this.user, this.role, false)
  }

}