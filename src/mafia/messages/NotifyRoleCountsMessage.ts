import { mention, Message } from "../../messages";
import { Role } from "../model/Role";
import * as Discord from 'discord.js';
import { PlayerStatuses } from "../model/PlayerStatuses";
import { shuffle } from "../../random";
import { roleText } from "./text";
import { StaticMessage } from '../../messages/Message';

export class NotifyRoleCountsMessage implements StaticMessage {
  readonly type = 'static'
  
  constructor(readonly statuses: PlayerStatuses) { }

  get content() {
    const playerNames = shuffle(this.statuses.alivePlayers())
      .map(mention)
      .join(', ')

    const roles = this.statuses.aliveRoleCounts()
      .map(([role, count]) => `${roleText.get(role)!.emoji} ${count} ${pluralise(role, count)}`)

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
  return count === 1 ? role.type : role.type + 's'
}