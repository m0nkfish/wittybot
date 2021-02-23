import { Emojis, mention } from "../../messages"
import {
  Distract,
  Kill,
  Protect,
  RoleCommandFactory,
  Track,
  Vote
} from "../commands"
import { Idle } from "../commands/idle"
import { Role } from "../model/Role"

export type RoleFlavour = {
  emoji: string
  name: string
  desc: string
}

const townDescription = `Together with the other townsfolk you must work together to identify and execute the killers.`
export function roleText(role: Role): RoleFlavour {
  switch (role.type) {
    case Role.Villager.type: return {
      emoji: Emojis.villager,
      name: "Villager",
      desc: `You are a humble Villager. ${townDescription}`,
    }
    case Role.Mayor.type: return {
      emoji: Emojis.tophat,
      name: "Mayor",
      desc: `You are the Mayor. Your vote counts twice! ${townDescription}`,
    }
    case Role.Inspector.type: return {
      emoji: Emojis.detective,
      name: "Inspector",
      desc: `You are the Inspector. ${townDescription}`,
    }
    case Role.Bodyguard.type: return {
      emoji: Emojis.shield,
      name: "Bodyguard",
      desc: `You are the Bodyguard. ${townDescription}`,
    }
    case Role.Escort.type: return {
      emoji: Emojis.kiss,
      name: "Escort",
      desc: `You are the Escort. ${townDescription}`,
    }
    case Role.Mafia.type: return {
      emoji: Emojis.dagger,
      name: "Mafia",
      desc: `You are a member of the Mafia. You must work with your partner to kill off all of the townsfolk and your rival killers.`,
    }
    case Role.Werewolf.type: return {
      emoji: Emojis.wolf,
      name: "Werewolf",
      desc: `You are the Werewolf. You must be cunning, and kill off all of the townsfolk and your rival killers.`,
    }
    case Role.Yakuza.type: return {
      emoji: Emojis.dragon,
      name: "Yakuza",
      desc: `You are a member of the Yakuza. You must work with your partner to kill off all of the townsfolk and your rival killers.`,
    }
    case Role.Jester.type: return {
      emoji: Emojis.rofl,
      name: "Jester",
      desc: `You are the Jester. You're on your own team, and you win if you get yourself executed by the daytime vote!`,
    }
  }
}

export type CommandFlavour = {
  verb: string
  desc: string
}
export function commandText(command: RoleCommandFactory | ReturnType<RoleCommandFactory>): CommandFlavour {
  switch (command.type) {
    case Vote.type: return {
      verb: "vote for",
      desc: `During each day, you can vote to execute another player.`,
    }
    case Kill.type: return {
      verb: "kill",
      desc: `During each night, you can choose one target to kill.`,
    }
    case Track.type: return {
      verb: "track",
      desc: `During each night, you can choose one target to inspect and discover their role.`,
    }
    case Distract.type: return {
      verb: "distract",
      desc: `During each night, you can choose one target to distract and prevent from performing any actions. Be careful of distracting the Werewolf without protection...`,
    }
    case Protect.type: return {
      verb: "protect",
      desc: `During each night, you can choose one target to protect from being killed.`,
    }
    case Idle.type: return {
      verb: "do nothing",
      desc: `You may choose to take no action`,
    }
  }
}

export const getCommandText = (command: ReturnType<RoleCommandFactory>) => {
  const append = command.target ? ` ${mention(command.target.user)} (${command.target.member.displayName})` : ""
  return commandText(command).verb + append
}

export function nightNumber(round: number) {
  return Math.ceil(round / 2)
}

export function dayNumber(round: number) {
  return Math.ceil(round / 2)
}
