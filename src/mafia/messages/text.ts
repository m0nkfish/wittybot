import { Role } from "../role"
import { MafiaRoleCommand } from '../commands/all';
import { CaseFactory } from "../../case";
import { Vote } from "../commands/vote";
import { Kill } from "../commands/kill";
import { Inspect } from "../commands/inspect";
import { Distract } from "../commands/distract";
import { Protect } from "../commands/protect";

export type RoleFlavour = {
  emoji: string
  desc: string
}

const townDescription = `Together with the other townsfolk you must work together to identify and execute the killers (Mafia/Werewolf).`
export const roleDescriptions = new Map<Role, RoleFlavour>([
  [Role.Villager, { emoji: '🙂', desc: `You are a humble Villager. ${townDescription}` }],
  [Role.Inspector, { emoji: '🕵️', desc: `You are the Inspector. ${townDescription}` }],
  [Role.Bodyguard, { emoji: '🛡️', desc: `You are the Bodyguard. ${townDescription}` }],
  [Role.Hooker, { emoji: '💋', desc: `You are the Hooker. ${townDescription}` }],
  [Role.Mafia, { emoji: '🗡️', desc: `You are a member of the Mafia. You must work with your partner to kill off all of the townsfolk and you rival killers.` }],
  [Role.Werewolf, { emoji: '🐺', desc: `You are the Werewolf. You must be cunning, and kill off all of the townsfolk and your rival killers.` }]
])

export const commandDescriptions = new Map<CaseFactory<MafiaRoleCommand>, string>([
  [Vote, `During each day, you can vote to kill others.`],
  [Kill, `During each night, you can choose one target to kill.`],
  [Inspect, `During each night, you can choose one target to inspect and discover their role.`],
  [Distract, `During each night, you can choose one target to distract and prevent from performing any actions.`],
  [Protect, `During each night, you can choose one target to protect from being killed.`],
])
