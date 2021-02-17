import * as Discord from 'discord.js';
import { Case } from '../case';
import { Values } from '../util';
import { MafiaRoleCommandFactory, Kill, Distract, Protect, Track } from './commands';
import { Role } from './Role';

export type PlayerIntention = {
  player: Discord.User
  role: Role
  action: MafiaRoleCommandFactory
  target: Discord.User
}

export type PlayerFate = ReturnType<Values<typeof PlayerFate>>
export const PlayerFate = {
  Distracted: Case('distracted', (target: Discord.User) => ({ target })),
  TargetProtected: Case('target-protected', (killer: Discord.User) => ({ killer })),
  Killed: Case('killed', (role: Role, target: Discord.User) => ({ role, target })),
  Tracked: Case('tracked', (player: Discord.User, target: Discord.User) => ({ player, target }))
}

type FoldState = {
  intentions: PlayerIntention[]
  fates: PlayerFate[]
}

export class PlayerIntentions {
  constructor(private readonly intentions: PlayerIntention[]) {}

  getIntention = (user: Discord.User) =>
    this.intentions.find(x => x.player === user)

  withIntention = (player: Discord.User, role: Role, action: MafiaRoleCommandFactory, target: Discord.User) =>
    new PlayerIntentions([...this.intentions, { player, role, action, target }])
  
  resolve = (): PlayerFate[] => {
    return [
      distractions,
      protections,
      kills(Role.Werewolf),
      kills(Role.Mafia),
      inspections
    ].reduce(({intentions, fates}, process) => {
        const [i, f] = process(intentions)
        return {
          intentions: i,
          fates: [...fates, ...f]
        }
      }, {
        intentions: this.intentions,
        fates: []
      } as FoldState)
      .fates
  }
}

function distractions(intentions: PlayerIntention[]): [PlayerIntention[], PlayerFate[]] {
  const fates: PlayerFate[] = []
  const distractions = intentions
    .filter(x => x.action === Distract)
  for (const { target } of distractions) {
    if (intentions.some(x => x.player === target)) {
      fates.push(PlayerFate.Distracted(target))
    }
    intentions = intentions.filter(x => x.player !== target)
  }
  return [intentions, fates]
}

function protections(intentions: PlayerIntention[]): [PlayerIntention[], PlayerFate[]] {
  const fates: PlayerFate[] = []
  const protections = intentions.filter(x => x.action === Protect)
  for (const { target } of protections) {
    const protectedKills = intentions.filter(x => x.action === Kill && x.target === target)
    for (const { player } of protectedKills) {
      fates.push(PlayerFate.TargetProtected(player))
    }
    intentions = intentions.filter(x => x.action !== Kill || x.target !== target)
  }
  return [intentions, fates]
}

const kills = (role: Role) => function(intentions: PlayerIntention[]): [PlayerIntention[], PlayerFate[]] {
  const fates: PlayerFate[] = []
  const kills = intentions.filter(x => x.action === Kill && x.role === role)
  for (const { role, target } of kills) {
    fates.push(PlayerFate.Killed(role, target))
    intentions = intentions.filter(x => x.player !== target)
  }
  return [intentions, fates]
}

function inspections(intentions: PlayerIntention[]): [PlayerIntention[], PlayerFate[]] {
  const fates: PlayerFate[] = []
  const inspections = intentions.filter(x => x.action === Track)
  for (const { player, target } of inspections) {
    fates.push(PlayerFate.Tracked(player, target))
  }
  return [intentions, fates]
}