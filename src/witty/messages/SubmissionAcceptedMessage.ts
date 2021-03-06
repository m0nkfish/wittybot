import * as Discord from 'discord.js'
import { Prompt } from '../prompts';
import { Message, StaticMessage } from '../../messages'

export class SubmissionAcceptedMessage implements StaticMessage {
  readonly type = 'static'

  constructor(readonly prompt: Prompt, readonly submission: string, readonly isReplacement: boolean) { }

  get content() {
    const message = new Discord.MessageEmbed()
      .setTitle(this.isReplacement ? `Replacement submission accepted` : `Submission accepted`)
      .setDescription([
        this.prompt.formatted,
        ``,
        this.submission
      ])
      .setFooter(`Submit again to replace this submission`)


    if (this.prompt.type === 'caption') {
      message.setThumbnail(this.prompt.prompt)
    }

    return message
  }
}