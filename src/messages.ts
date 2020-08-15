import * as Discord from 'discord.js'

export type Destination = Discord.TextChannel | Discord.User

export class Envelope {
  constructor(readonly destination: Destination, readonly message: Message) {}

  send() {
    const content = this.message.content
    if (content instanceof Discord.MessageEmbed) {
      content.setColor('#A4218A')
    }
    return this.destination.send(this.message.content)
  }
}

export interface Message {
  content: string | Discord.MessageAdditions
}

export class ReleaseMessage implements Message {
  constructor(readonly promptsCount: number) { }

  get content() {
    return new Discord.MessageEmbed()
      .setTitle('Bot restarted/redeployed')
      .setFooter(`This version has ${this.promptsCount} miscellaneous prompts, quotes, lyrics, headlines and proverbs`)
  }
}
