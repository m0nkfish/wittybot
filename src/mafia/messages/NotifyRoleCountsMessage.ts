import * as Discord from 'discord.js';
import { mention } from "../../messages";
import { StaticMessage } from '../../messages/Message';
import { shuffle } from "../../random";
import { Players } from "../model/Players";
import { Role } from "../model/Role";
import { roleText } from "./text";

export class NotifyRoleCountsMessage implements StaticMessage {
  readonly type = 'static'

  constructor(readonly players: Players) { }

  get content() {
    const playerNames = shuffle(this.players.alive())
      .map(x => mention(x.user))

    const roles = this.players.aliveRoleCounts()
      .map(([role, count]) => `${roleText(role).emoji} ${count} ${pluralise(role, count)}`)

    return new Discord.MessageEmbed()
      .setTitle(`There are ${this.players.alive().length} players left alive`)
      .addField('Roles', roles, true)
      .addField('Players', playerNames, true)
  }
}

function pluralise(role: Role, count: number) {
  return count === 1 ? roleText(role).name : roleText(role).name + 's'

}