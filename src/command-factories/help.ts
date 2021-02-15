import * as Discord from 'discord.js'
import { GlobalCommandFactory, Help } from '../commands'
import { MessageReceived } from '../discord-events';

export const HelpCommandFactory = () => new GlobalCommandFactory(event => {
  if (event.type === MessageReceived.type) {
    const {message} = event
    const source = message.channel instanceof Discord.TextChannel ? message.channel : message.author
    if (message.content === '!help') {
      return Help(source)
    }
  }
})
