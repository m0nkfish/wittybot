import { mention, Message } from "../../messages";
import { Role } from "../role";
import * as Discord from 'discord.js';
import { commandDescriptions, roleDescriptions } from './text';

export class NotifyRoleMessage implements Message {

  constructor(readonly role: Role, readonly partner?: Discord.User) { }

  get content() {
    const role = roleDescriptions.get(this.role)!
    const { day, night } = this.role.commands
    return new Discord.MessageEmbed()
      .setTitle(`${role.emoji} ${role.desc}`)
      .setDescription([
        this.partner && `Your partner is ${mention(this.partner)}.`,
        day && commandDescriptions.get(day),
        night && commandDescriptions.get(night)
      ])
  }
}

