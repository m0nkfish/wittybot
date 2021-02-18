import { Role } from './Role';
import * as Discord from 'discord.js';
import { lazy, Lazy } from '../../util';

export class Player {
  readonly teammates: Lazy<Player[]>

  constructor(
    readonly user: Discord.User,
    readonly role: Role,
    readonly isAlive: boolean,
    teammates: () => Player[]
  ) {
    this.teammates = lazy(teammates)
  }


}