import { Case } from '../../case';
import { Values } from '../../util';
import { Distract, Kill, MafiaRoleCommandFactory, Protect, Track } from '../commands';
import { Player } from './Player';
import { Role } from './Role';

export type PlayerIntention = {
  player: Player
  action: MafiaRoleCommandFactory
  target: Player
}

export type PlayerFate = ReturnType<Values<typeof PlayerFate>>
export const PlayerFate = {
  Distracted: Case('distracted', (target: Player) => ({ target })),
  TargetProtected: Case('target-protected', (killer: Player) => ({ killer })),
  Killed: Case('killed', (killer: Player, target: Player) => ({ role: killer.role, target })),
  Tracked: Case('tracked', (player: Player, target: Player) => ({ player, target }))
}

type FoldState = {
  intentions: PlayerIntention[]
  fates: PlayerFate[]
}

export class PlayerIntentions {
  constructor(private readonly intentions: PlayerIntention[]) {}

  get = (user: Player) =>
    this.intentions.find(x => x.player === user)

  with = (player: Player, action: MafiaRoleCommandFactory, target: Player) =>
    new PlayerIntentions([...this.intentions, { player, action, target }])

  cancel = (player: Player) =>
    new PlayerIntentions(this.intentions.filter(x => x.player !== player))
  
  resolve = (): PlayerFate[] => {
    return [
      distractions,
      protections,
      kills(Role.Werewolf),
      kills(Role.Mafia),
      kills(Role.Yakuza),
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
  const kills = intentions.filter(x => x.action === Kill && x.player.role === role)
  for (const { player, target } of kills) {
    fates.push(PlayerFate.Killed(player, target))
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