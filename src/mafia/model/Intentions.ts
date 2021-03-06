import { Case, isCase } from '../../case';
import { partition, Values } from '../../util';
import { Distract, Kill, NightCommand, Protect, Track } from '../commands';
import { Player } from './Player';
import { Role } from './Role';

export type NightFate = ReturnType<Values<typeof NightFate>>
export const NightFate = {
  Distracted: Case('distracted', (target: Player) => ({ target })),
  TargetProtected: Case('target-protected', (killer: Player) => ({ killer })),
  Killed: Case('killed', (killer: Player, target: Player) => ({ killer, target })),
  Tracked: Case('tracked', (player: Player, target: Player) => ({ player, target }))
}

type FoldState = {
  intentions: NightCommand[]
  fates: NightFate[]
}

export class Intentions {
  constructor(private readonly intentions: NightCommand[]) { }

  get = (user: Player) =>
    this.intentions.find(x => x.user === user)

  with = (command: NightCommand) =>
    new Intentions([...this.intentions, command])

  cancel = (player: Player) =>
    new Intentions(this.intentions.filter(x => x.user !== player))

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

function createProcess(f: (intentions: NightCommand[]) => [NightCommand[], NightFate[]]) {
  return function (foldState: FoldState) {
    const [intentions, fates] = f(foldState.intentions)
    return {
      intentions,
      fates: [...foldState.fates, ...fates]
    }
  }
}

const distractions = createProcess(intentions => {
  const fates: NightFate[] = []
  let [rest, distractions] = partition(intentions, isCase(Distract))
  for (const { target: distractee, user: distracter } of distractions) {
    if (rest.some(x => x.user === distractee)) {
      fates.push(NightFate.Distracted(distractee))
    }
    rest = rest.filter(x => x.user !== distractee)

    // specific interaction: distracting the werewolf directs its attention towards you, but you can be saved by the bodyguard
    if (distractee.role === Role.Werewolf) {
      rest = [...rest, Kill(distractee, distracter)]
    }
  }
  return [rest, fates]
})

const protections = createProcess(intentions => {
  const fates: NightFate[] = []
  let [rest, protections] = partition(intentions, isCase(Protect))
  for (const { target: protectee } of protections) {
    const [other, protectedKills] = partition(rest, x => isCase(Kill)(x) && x.target === protectee)
    for (const { user } of protectedKills) {
      fates.push(NightFate.TargetProtected(user))
    }
    rest = other
  }
  return [rest, fates]
})

const kills = (role: Role) => createProcess(intentions => {
  const fates: NightFate[] = []
  const kills = intentions.filter(isCase(Kill)).filter(x => x.user.role === role)
  for (const { user: killer, target: killee } of kills) {
    fates.push(NightFate.Killed(killer, killee))
    intentions = intentions.filter(x => x.user !== killee && x.target !== killee)
  }
  return [intentions, fates]
})

const inspections = createProcess(intentions => {
  const [other, tracks] = partition(intentions, isCase(Track))
  return [other, tracks.map(x => NightFate.Tracked(x.user, x.target))]
})