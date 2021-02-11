import * as Discord from 'discord.js'
import { Prompt } from '../prompts';
import { Message } from '../../messages'

export class VoteAcceptedMessage implements Message {
  constructor(readonly prompt: Prompt, readonly entry: number, readonly submission: string) { }

  get content() {
    const msg = new Discord.MessageEmbed()
      .setTitle(`Vote recorded for entry ${this.entry}`)
      .setDescription([
        this.prompt.formatted,
        ``,
        this.submission
      ])
      .setFooter(`Message again to replace your vote`)

    if (this.prompt.type === 'caption') {
      msg.setImage(this.prompt.prompt)
    }

    return msg
  }
}
