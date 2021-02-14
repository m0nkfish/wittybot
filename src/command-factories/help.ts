import * as Discord from 'discord.js'
import { GlobalCommandFactory, Help } from '../commands'

export const HelpCommandFactory = () => new GlobalCommandFactory(message => {
  const source = message.channel instanceof Discord.TextChannel ? message.channel : message.author
  if (message.content === '!help') {
    return Help(source)
  }
})
