import * as Discord from 'discord.js';
import { Player } from './Player';
import { Role, Team } from "./Role";

export class Players {
  constructor(readonly players: Player[]) { }

  checkWinners = (): Team | undefined => {
    const teams = new Set<Team>()
    for (const p of this.players) {
      if (p.isAlive) {
        teams.add(p.role.team)
      }
      if (teams.size > 1) {
        return
      }
    }

    if (teams.size === 1) {
      return Array.from(teams.keys())[0]
    }
  }

  find = (user: Discord.User) => this.players.find(x => x.user === user)

  kill = (players: Player[]) =>
    new Players(this.players.map(x => players.includes(x) ? x.kill() : x))

  alive = () =>
    this.players.filter(x => x.isAlive)

  findPartners = (player: Player): Player[] | undefined =>
    player.role.team.partnership
      ? this.players.filter(p => p.role.team === player.role.team && p !== player)
      : undefined

  aliveRoleCounts = () =>
    Array.from(this.players
      .filter(x => x.isAlive)
      .reduce((map, x) => map.set(x.role, 1 + (map.get(x.role) ?? 0)), new Map<Role, number>())
      .entries())
}