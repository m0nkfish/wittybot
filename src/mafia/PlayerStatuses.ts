import * as Discord from 'discord.js';
import { Role } from "./role";
import { MafiaRoleCommandFactory } from './commands/all';

export type PlayerStatus = {
  player: Discord.User
  role: Role
  isAlive: boolean
}

export class PlayerStatuses {
  constructor(readonly players: PlayerStatus[]) { }

  winners = () => {
    let town = 0
    let wolf = 0
    let mafia = 0
    
    this.alive()
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