import { Message } from "../../messages";
import { Role, roleCommands } from "../role";
import * as Discord from 'discord.js';
import { commandDescriptions, roleDescriptions } from "./text";

export class NotifyRoleMessage implements Message {

  constructor(readonly role: Role, readonly partner?: Discord.User) { }

  get content() {
    const role = roleDescriptions.get(this.role)!
    return new Discord.MessageEmbed()
      .setTitle(`${role.emoji} ${role.desc}`)
      .setDescription([
        ...this.partner ? [`Your partner is ${this.partner}.`] : [],
        ...roleCommands.get(this.role)!.map(c => commandDescriptions.get(c)!),
      ])
  }
}

