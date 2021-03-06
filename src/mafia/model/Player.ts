import * as Discord from 'discord.js';
import { Case } from '../../case';
import { Values } from '../../util';
import { RoleCommandFactory, Vote } from '../commands';
import { Idle } from '../commands/idle';
import { Role, Team } from './Role';

export type Status = ReturnType<Values<typeof Status>>
export const Status = {
  Killed: Case('killed', (by: Player, round: number) => ({ by, round })),
  Executed: Case('executed', (round: number) => ({ round })),
  Alive: Case('alive', () => { })
}

export class Player {
  constructor(
    readonly member: Discord.GuildMember,
    readonly role: Role,
    readonly status: Status,
  ) {
  }

  get user() { return this.member.user }

  get isAlive() {
    return this.status.type === Status.Alive.type
  }

  canPerform(roleCmd: ReturnType<RoleCommandFactory> | ReturnType<typeof Vote>) {
    switch (roleCmd.type) {
      case Vote.type:
        return this.isAlive && this.role.commands.day === Vote

      case Idle.type:
        return this.isAlive

      default:
        return this.isAlive && this.role.commands.night?.type === roleCmd.type
    }
  }

  kill(by: Player, round: number) {
    return new Player(this.member, this.role, Status.Killed(by, round))
  }

  execute(round: number) {
    return new Player(this.member, this.role, Status.Executed(round))
  }

  get voteCount() {
    return this.role === Role.Mayor ? 2 : 1
  }

  isOnTeam = (team: Team) => this.role.team === team

}