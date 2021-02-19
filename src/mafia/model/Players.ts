import * as Discord from 'discord.js';
import { NightFate } from './Intentions';
import { Player, Status } from './Player';
import { Role, Team } from "./Role";

export class Players {
  constructor(readonly players: Player[]) { }

  checkWinners = (): Team | undefined => {
    const teams = new Set<Team>()
    for (const p of this.players) {
      if (p.role === Role.Jester) {
        if (p.status.type === Status.Executed.type) {
          return p.role.team
        }
      } else if (p.isAlive) { // Jester doesn't count as a 'remaining' team
        teams.add(p.role.team)
      }
    }
    
    if (teams.size === 1) {
      return Array.from(teams.keys())[0]
    }
  }

  find = (user: Discord.User) => this.players.find(x => x.user === user)

  execute = (player: Player, round: number) =>
    new Players(this.players.map(p => p === player ? p.execute(round) : p))

  kill = (kills: ReturnType<typeof NightFate.Killed>[], round: number) =>
    new Players(this.players.map(p => {
      const kill = kills.find(k => k.target === p)
      return kill ? p.kill(kill.killer, round) : p
    }))

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