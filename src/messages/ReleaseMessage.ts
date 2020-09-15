import * as Discord from 'discord.js'
import { Message } from './index'

export class ReleaseMessage implements Message {
  constructor(readonly testMode: boolean) { }

  get content() {
    let title = ':robot: Bot restarted/redeployed'
    if (this.testMode) {
      title += ' (test mode)'
    }

    return new Discord.MessageEmbed()
      .setTitle(title)
  }
}
