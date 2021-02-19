import * as Discord from 'discord.js';
import { Emojis } from './emojis';
import { mention } from "./mention";
import { StaticMessage } from "./Message";

export class RoleMentionNotifyMessage implements StaticMessage {
  readonly type = 'static'

  constructor(readonly role: Discord.Role) { }

  readonly notify = Emojis.bell
  readonly unnotify = Emojis.noBell

  readonly reactable = {
    reacts: [this.notify, this.unnotify]
  }

  get content() {
    return `Calling all ${mention(this.role)}! (${Emojis.pointLeft} react to this message with ${this.notify} to join this role, or ${this.unnotify} to be removed)`
  }
}