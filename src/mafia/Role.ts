import { CaseFactory } from "../case";
import { MafiaRoleCommand } from "./commands";
import { Distract } from "./commands/distract";
import { Inspect } from "./commands/inspect";
import { Kill } from "./commands/kill";
import { Protect } from "./commands/protect";
import { Vote } from "./commands/vote";

export enum Role {
  Villager = 'villager',
  Inspector = 'inspector',
  Mafia = 'mafia',
  Hooker = 'hooker',
  Werewolf = 'werewolf',
  Bodyguard = 'bodyguard'
}

export const roleCommands = new Map<Role, CaseFactory<MafiaRoleCommand>[]>([
  [Role.Villager, [Vote]],
  [Role.Inspector, [Vote, Inspect]],
  [Role.Mafia, [Vote, Kill]],
  [Role.Hooker, [Vote, Distract]],
  [Role.Werewolf, [Vote, Kill]],
  [Role.Bodyguard, [Vote, Protect]]
])