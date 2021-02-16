import { mention, Message } from "../../messages";
import { Role } from "../role";
import * as Discord from 'discord.js';
import { PlayerStatuses } from "../PlayerStatuses";
import { shuffle } from "../../random";
import { roleDescriptions } from "./text";

export class NotifyRoleCountsMessage implements Message {
  constructor(readonly statuses: PlayerStatuses) { }

  get content() {
    const playerNames = shuffle(this.statuses.alivePlayers())
      .map(mention)
      .join(', ')

    const roles = this.statuses.aliveRoleCounts()
      .map(([role, count]) => `${roleDescriptions.get(role)!.emoji} ${count} ${pluralise(role, count)}`)

    return new Discord.MessageEmbed()
      .setTitle(`The game begins with ${this.statuses.aliveCount()} players:`)
      .setDescription([
        playerNames,
        ``,
        `The roles are:`,
        ...roles
      ])
  }
}

function pluralise(role: Role, count: number) {
  return count === 1 ? role : role + 's'
}