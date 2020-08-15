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

export class BasicMessage implements Message {
  constructor(readonly content: string) { }
}

export class ReleaseMessage implements Message {
  constructor(readonly promptsCount: number) { }

  get content() {
    return new Discord.MessageEmbed()
      .setTitle('Bot restarted/redeployed')
      .setFooter(`This version has ${this.promptsCount} miscellaneous prompts, quotes, lyrics, headlines and proverbs`)
  }
}


export class HelpMessage implements Message {
  constructor(readonly promptsCount: number) { }

  get content() {
    return new Discord.MessageEmbed()
      .setTitle('Wittybot help')
      .setDescription(`Wittybot is a simple, fast-paced text game where you submit text answers to prompts, then vote for the funniest one.`)
      .addField('How to play', [
        `1. Someone starts a game with the \`!witty\` command`,
        `2. The bot sends a prompt to the channel`,
        `3. Players have a certain amount of time to DM the bot a submission completing the prompt with the funniest thing they can think of`,
        `4. After submissions are in and the time's up, players DM the bot their vote for the funniest entry`,
        `5. Repeat ad infinitum`
      ])
      .addField('Commands', [
        `\`!help\` - you're looking at it`,
        `\`!witty\` - start a new game`,
        `\`!skip\` - skip the current prompt`,
        `\`!notify\` - be notified when a new game starts`,
        `\`!unnotify\` - stop being notified when a new game starts`,
        `\`!scores\` - view the scoreboard`
      ])
      .setFooter(`This version has ${this.promptsCount} miscellaneous prompts, quotes, lyrics, headlines and proverbs`)
  }
}

export class NewRoundMessage implements Message {
  constructor(readonly botUser: Discord.User, readonly submitDurationSec: number) { }

  get content() {
    return new Discord.MessageEmbed()
      .setTitle('A new round begins! Complete the prompt')
      .setDescription([
        prompt,
        ``,
        `Submit by DMing <@${this.botUser.id}> (:point_left: on desktop just click here)`])
      .setFooter(`You have ${this.submitDurationSec} seconds to come up with an answer`)
  }
}

export class GameStartedMessage extends BasicMessage {
  constructor(notifyRole: Discord.Role, startedBy: Discord.User) {
    super(`Calling all <@&${notifyRole.id}>! (:point_left: type !notify if you want to be in this group) A new game was started by <@${startedBy.id}>`)
  }
}