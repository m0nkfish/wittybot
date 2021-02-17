import * as Discord from 'discord.js'
import { Prompt } from '../prompts';
import { Message, StaticMessage } from '../../messages'

export class VoteAcceptedMessage implements StaticMessage {
  readonly type = 'static'
  
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
      msg.setThumbnail(this.prompt.prompt)
    }

    return msg
  }
}
