import * as Discord from 'discord.js';
import { Case } from '../../case';
import { Values } from '../../util';
import { MafiaRoleCommandFactory } from '../commands';
import { Role, Team } from './Role';

export type Status = ReturnType<Values<typeof Status>>
export const Status = {
  Killed: Case('killed', (by: Player, round: number) => ({ by, round })),
  Executed: Case('executed', (round: number) => ({ round })),
  Alive: Case('alive', () => { })
}

export class Player {
  constructor(
    readonly user: Discord.User,
    readonly role: Role,
    readonly status: Status,
  ) {
  }

  get isAlive() {
    return this.status.type === Status.Alive.type
  }

  canPerform(action: MafiaRoleCommandFactory) {
    return this.isAlive && this.role.commands.day === action || this.role.commands.night === action
  }

  kill(by: Player, round: number) {
    return new Player(this.user, this.role, Status.Killed(by, round))
  }

  execute(round: number) {
    return new Player(this.user, this.role, Status.Executed(round))
  }

  isOnTeam = (team: Team) => this.role.team === team

}