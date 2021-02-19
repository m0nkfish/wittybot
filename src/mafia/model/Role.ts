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

  Inspector: {
    type: 'inpector' as const,
    team: Team.Townsfolk,
    commands: { day: Vote, night: Track }
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

  Bodyguard: {
    type: 'bodyguard' as const,
    team: Team.Townsfolk,
    commands: { day: Vote, night: Protect }
  },

  Jester: {
    type: 'jester' as const,
    team: Team.Jester,
    commands: { day: Vote }
  }
}

export const AllRoles: Role[] = Object.values(Role)