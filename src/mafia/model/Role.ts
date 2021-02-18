import { Values } from "../../util";
import { MafiaRoleCommandFactory, Distract, Track, Kill, Protect, Vote } from "../commands";

export enum Team {
  Townsfolk = 'townsfolk',
  Mafia = 'mafia',
  Werewolf = 'werewolf'
}

export type Role = {
  type: Values<typeof Role>['type']
  team: Team
  commands: {
    day?: MafiaRoleCommandFactory
    night?: MafiaRoleCommandFactory
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

  Hooker: { 
    type: 'hooker' as const,
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
}
