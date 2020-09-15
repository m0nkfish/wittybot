import * as Discord from 'discord.js'
import { Prompt } from '../prompts';
import { Message } from './index'

export class SubmissionAcceptedMessage implements Message {
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

    return message
  }
}