import { Values } from "../util";
import { MafiaRoleCommandFactory, Distract, Track, Kill, Protect, Vote } from "./commands";

export type Role = {
  type: Values<typeof Role>['type']
  commands: {
    day?: MafiaRoleCommandFactory
    night?: MafiaRoleCommandFactory
  }
}
export const Role = {
  Villager: {
    type: 'villager' as const,
    commands: { day: Vote }
  },

  Inspector: {
    type: 'inpector' as const,
    commands: { day: Vote, night: Track }
  },

  Mafia: {
    type: 'mafia' as const,
    commands: { day: Vote, night: Kill }
  },

  Hooker: { 
    type: 'hooker' as const,
    commands: { day: Vote, night: Distract }
  },

  Werewolf: {
    type: 'werewolf' as const,
    commands: { day: Vote, night: Kill }
  },

  Bodyguard: {
    type: 'bodyguard' as const, 
    commands: { day: Vote, night: Protect }
  },
}
