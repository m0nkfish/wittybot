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

export type NightFate = ReturnType<Values<typeof NightFate>>
export const NightFate = {
  Distracted: Case('distracted', (target: Player) => ({ target })),
  TargetProtected: Case('target-protected', (killer: Player) => ({ killer })),
  Killed: Case('killed', (killer: Player, target: Player) => ({ killer, target })),
  Tracked: Case('tracked', (player: Player, target: Player) => ({ player, target }))
}

type FoldState = {
  intentions: PlayerIntention[]
  fates: NightFate[]
}

export class PlayerIntentions {
  constructor(private readonly intentions: PlayerIntention[]) {}

  get = (user: Player) =>
    this.intentions.find(x => x.player === user)

  with = (player: Player, action: MafiaRoleCommandFactory, target: Player) =>
    new PlayerIntentions([...this.intentions, { player, action, target }])

  cancel = (player: Player) =>
    new PlayerIntentions(this.intentions.filter(x => x.player !== player))
  
  resolve = (): NightFate[] => {
    return [
      distractions,
      protections,
      kills(Role.Werewolf),
      kills(Role.Mafia),
      kills(Role.Yakuza),
      inspections
    ].reduce<FoldState>((state, process) => process(state), { intentions: this.intentions, fates: [] })
      .fates
  }
}

function createProcess(f: (intentions: PlayerIntention[]) => [PlayerIntention[], NightFate[]]) {
  return function(foldState: FoldState) {
    const [intentions, fates] = f(foldState.intentions)
    return {
      intentions,
      fates: [...foldState.fates, ...fates]
    }
  }
}

const distractions = createProcess(intentions => {
  const fates: NightFate[] = []
  const distractions = intentions
    .filter(x => x.action === Distract)
  for (const { player, target } of distractions) {
    if (intentions.some(x => x.player === target)) {
      fates.push(NightFate.Distracted(target))
    }
    if (target.role === Role.Werewolf) {
      fates.push(NightFate.Killed(target, player))
    }
    intentions = intentions.filter(x => x.player !== target)
  }
  return [intentions, fates]
})

const protections = createProcess(intentions => {
  const fates: NightFate[] = []
  const protections = intentions.filter(x => x.action === Protect)
  for (const { target } of protections) {
    const protectedKills = intentions.filter(x => x.action === Kill && x.target === target)
    for (const { player } of protectedKills) {
      fates.push(NightFate.TargetProtected(player))
    }
    intentions = intentions.filter(x => x.action !== Kill || x.target !== target)
  }
  return [intentions, fates]
})

const kills = (role: Role) => createProcess(intentions => {
  const fates: NightFate[] = []
  const kills = intentions.filter(x => x.action === Kill && x.player.role === role)
  for (const { player, target } of kills) {
    fates.push(NightFate.Killed(player, target))
    intentions = intentions.filter(x => x.player !== target)
  }
  return [intentions, fates]
})

const inspections = createProcess(intentions => {
  const fates: NightFate[] = []
  const inspections = intentions.filter(x => x.action === Track)
  for (const { player, target } of inspections) {
    fates.push(NightFate.Tracked(player, target))
  }
  return [intentions, fates]
})