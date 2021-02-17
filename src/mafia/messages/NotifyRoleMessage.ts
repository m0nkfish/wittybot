import { mention, StaticMessage } from "../../messages";
import { Role } from "../Role";
import * as Discord from 'discord.js';
import { commandDescriptions, roleText } from './text';

export class NotifyRoleMessage implements StaticMessage {
  readonly type = 'static'

  constructor(readonly role: Role, readonly partner?: Discord.User) { }

  get content() {
    const role = roleText.get(this.role)!
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

