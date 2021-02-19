import * as Discord from 'discord.js';
import { mention } from "../../messages";
import { StaticMessage } from '../../messages/Message';
import { shuffle } from "../../random";
import { Players } from "../model/Players";
import { Role } from "../model/Role";
import { roleText } from "./text";

export class NotifyRoleCountsMessage implements StaticMessage {
  readonly type = 'static'
  
  constructor(readonly statuses: Players) { }

  get content() {
    const playerNames = shuffle(this.statuses.alive())
      .map(x => mention(x.user))
      .join(', ')

    const roles = this.statuses.aliveRoleCounts()
      .map(([role, count]) => `${roleText(role).emoji} ${count} ${pluralise(role, count)}`)

    return new Discord.MessageEmbed()
      .setTitle(`The game begins with ${this.statuses.alive().length} players:`)
      .setDescription([
        playerNames,
        ``,
        `The roles are:`,
        ...roles
      ])
  }
}

function pluralise(role: Role, count: number) {
  return count === 1 ? roleText(role).name : roleText(role).name + 's'

}