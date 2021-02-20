import * as Discord from 'discord.js';
import { mention, StaticMessage } from "../../messages";
import { Player } from "../model/Player";
import { Role } from "../model/Role";
import { commandText, roleText } from './text';

export class NotifyRoleMessage implements StaticMessage {
  readonly type = 'static'

  constructor(readonly role: Role, readonly partners?: Player[]) { }

  get content() {
    const { emoji, desc } = roleText(this.role)
    const { day, night } = this.role.commands
    return new Discord.MessageEmbed()
      .setTitle(`${emoji} ${desc}`)
      .setDescription([
        this.partners && `Your partners are: ${this.partners.map(u => mention(u.user)).join(', ')}.`,
        day && commandText(day).desc,
        night && commandText(night).desc
      ])
  }
}

