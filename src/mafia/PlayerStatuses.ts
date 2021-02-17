import * as Discord from 'discord.js';
import { Role, Team } from "./role";
import { MafiaRoleCommandFactory } from './commands/all';

export type PlayerStatus = {
  player: Discord.User
  role: Role
  isAlive: boolean
}

export class PlayerStatuses {
  constructor(readonly players: PlayerStatus[]) { }

  checkWinners = (): Team | undefined => {
    const counts = this.alive()
      .reduce((acc, {role}) => ({ ...acc, [role.team]: (acc[role.team] ?? 0) + 1}), {} as Record<Team, number>)

    const aliveTeams = Object.entries(counts).filter(([_, count]) => count > 0)
    if (aliveTeams.length === 1) {
      return aliveTeams[0][0] as Team
    }
  }

  checkAction = (user: Discord.User, command: MafiaRoleCommandFactory) =>{
    const status = this.players.find(x => x.player === user)
    if (!status || !status.isAlive) {
      return false
    }

    const {commands} = status.role
    return [commands.day, commands.night].includes(command)
  }

  kill = (users: Discord.User[]) =>
    new PlayerStatuses(this.players.map(x => users.includes(x.player) ? {...x, isAlive: false } : x))

  role = (player: Discord.User) =>
    this.players.find(x => x.player === player)!.role

  roles = () =>
    new Map(this.players.map(x => [x.player, x.role] as const))

  isAlive = (user: Discord.User) =>
    this.players.find(x => x.player === user)?.isAlive ?? false

  alive = () =>
    this.players.filter(x => x.isAlive)

  findPartner = (user: Discord.User): Discord.User | undefined =>
    this.role(user) === Role.Mafia
    ? this.players
        .filter(x => x.role === Role.Mafia && x.player !== user)
        .map(x => x.player)[0]
    : undefined

  aliveRoleCounts = () =>
    Array.from(this.players
      .filter(x => x.isAlive)
      .reduce((map, x) => map.set(x.role, 1 + (map.get(x.role) ?? 0)), new Map<Role, number>())
      .entries())

  aliveCount = () =>
    this.alive()
      .length

  alivePlayers = () =>
    this.alive()
      .map(x => x.player)
}