import { MafiaRoleCommandFactory, Distract, Track, Kill, Protect, Vote } from "./commands";

export enum Role {
  Villager = 'villager',
  Inspector = 'inspector',
  Mafia = 'mafia',
  Hooker = 'hooker',
  Werewolf = 'werewolf',
  Bodyguard = 'bodyguard'
}

type RoleCommands = {
  day?: MafiaRoleCommandFactory
  night?: MafiaRoleCommandFactory
}

export const roleCommands = new Map<Role, RoleCommands>([
  [Role.Villager, { day: Vote }],
  [Role.Inspector, { day: Vote, night: Track }],
  [Role.Mafia, { day: Vote, night: Kill }],
  [Role.Hooker, { day: Vote, night: Distract }],
  [Role.Werewolf, { day: Vote, night: Kill }],
  [Role.Bodyguard, { day: Vote, night: Protect }]
])