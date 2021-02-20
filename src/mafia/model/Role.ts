import { Values } from "../../util";
import { DayCommandFactory, Distract, Kill, NightCommandFactory, Protect, Track, Vote } from "../commands";

export type Team = {
  type: Values<typeof Team>['type']
  isPartnership: boolean
}

export const Team = {
  Townsfolk: {
    type: 'townsfolk' as const,
    isPartnership: false
  },

  Mafia: {
    type: 'mafia' as const,
    isPartnership: true
  },

  Werewolf: {
    type: 'werewolf' as const,
    isPartnership: false
  },

  Yakuza: {
    type: 'yakuza' as const,
    isPartnership: true
  },

  Jester: {
    type: 'jester' as const,
    isPartnership: false
  }
}

export type Role = {
  type: Values<typeof Role>['type']
  team: Team
  commands: {
    day?: DayCommandFactory
    night?: NightCommandFactory
  }
}

export const Role = {
  Villager: {
    type: 'villager' as const,
    team: Team.Townsfolk,
    commands: { day: Vote }
  },

  Mayor: {
    type: 'mayor' as const,
    team: Team.Townsfolk,
    commands: { day: Vote }
  },

  Inspector: {
    type: 'inpector' as const,
    team: Team.Townsfolk,
    commands: { day: Vote, night: Track }
  },

  Bodyguard: {
    type: 'bodyguard' as const,
    team: Team.Townsfolk,
    commands: { day: Vote, night: Protect }
  },

  Escort: {
    type: 'escort' as const,
    team: Team.Townsfolk,
    commands: { day: Vote, night: Distract }
  },

  Werewolf: {
    type: 'werewolf' as const,
    team: Team.Werewolf,
    commands: { day: Vote, night: Kill }
  },

  Mafia: {
    type: 'mafia' as const,
    team: Team.Mafia,
    commands: { day: Vote, night: Kill }
  },

  Yakuza: {
    type: 'yakuza' as const,
    team: Team.Yakuza,
    commands: { day: Vote, night: Kill }
  },

  Jester: {
    type: 'jester' as const,
    team: Team.Jester,
    commands: { day: Vote }
  }
}

export const AllRoles: Role[] = Object.values(Role)