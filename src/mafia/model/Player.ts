import * as Discord from 'discord.js';
import { Case } from '../../case';
import { MafiaRoleCommandFactory } from '../commands';
import { Role, Team } from './Role';

export const Killed = Case('killed', (by: Player, night: number) => ({ by, night }))
export const Executed = Case('executed', (day: number) => ({ day }))
export const Alive = Case('alive', () => {})
export type Status =
| ReturnType<typeof Killed>
| ReturnType<typeof Executed>
| ReturnType<typeof Alive>

export class Player {
  constructor(
    readonly user: Discord.User,
    readonly role: Role,
    readonly status: Status,
  ) {
  }

  get isAlive() {
    return this.status.type === Alive.type
  }

  canPerform(action: MafiaRoleCommandFactory) {
    return this.isAlive && this.role.commands.day === action || this.role.commands.night === action
  }

  kill(by: Player, night: number) {
    return new Player(this.user, this.role, Killed(by, night))
  }

  execute(day: number) {
    return new Player(this.user, this.role, Executed(day))
  }

  isOnTeam = (team: Team) => this.role.team === team

}