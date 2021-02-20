import * as Discord from 'discord.js';
import { GlobalCommandFactory, Help } from '../commands';
import { MessageReceived } from '../discord-events';

export const HelpCommandFactory = () => new GlobalCommandFactory(event => {
  if (event.type === MessageReceived.type) {
    const { message } = event
    const source = message.channel instanceof Discord.TextChannel ? message.channel : message.author

    const match = /^!help\b/.exec(message.content)
    if (match) {
      if (message.content === '!help') {
        message.reply('Try `!help witty` or `!help mafia`')
      } else {
        return Help(source, message.content.substr('!help '.length))
      }
    }
  }
})
