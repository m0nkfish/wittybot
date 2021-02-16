import * as Discord from 'discord.js';
import { Role } from "./role";
import wu from 'wu';
import { MafiaRoleCommandFactory } from './commands/all';
import { roleCommands } from './Role';

export type PlayerStatus = {
  role: Role
  isAlive: boolean
}

export class PlayerStatuses {
  constructor(readonly players: Map<Discord.User, PlayerStatus>) { }

  update = (user: Discord.User, status: Partial<PlayerStatus>) =>
    new PlayerStatuses(new Map(this.players).set(user, { ...this.players.get(user)!, ...status }))

  checkAction = (user: Discord.User, command: MafiaRoleCommandFactory) =>{
    const status = this.players.get(user)
    if (!status || !status.isAlive) {
      return false
    }

    const commands = roleCommands.get(status.role)!;
    return [commands.day, commands.night].includes(command)
  }

  isAlive = (user: Discord.User) =>
    this.players.get(user)?.isAlive ?? false

  alive = () =>
    wu(this.players)
      .filter(isAlive)
      .toArray()

  findPartner = (user: Discord.User): Discord.User | undefined =>
    this.players.get(user)!.role === Role.Mafia
    ? wu(this.players)
        .filter(([u, { role }]) => role === Role.Mafia && u !== user)
        .map(getUser)
        .toArray()[0]
    : undefined

  aliveRoleCounts = () =>
    Array.from(wu(this.players)
      .filter(isAlive)
      .reduce((map, [_, { role }]) => map.set(role, 1 + (map.get(role) ?? 0)), new Map<Role, number>())
      .entries())

  aliveCount = () =>
    wu(this.players)
      .filter(isAlive)
      .reduce((a, _) => a + 1, 0)

  alivePlayers = () =>
    wu(this.players)
      .filter(isAlive)
      .map(getUser)
      .toArray()
}

const isAlive = ([_, { isAlive }]: [Discord.User, PlayerStatus]) => isAlive
const getUser = ([user]: [Discord.User, PlayerStatus]) => user