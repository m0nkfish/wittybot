import * as Discord from 'discord.js'
import { Send } from '../actions'
import { Case } from '../case'
import { HelpMessage } from '../messages'
import { GlobalCommandFactory } from './global-command-factory'
import { GlobalCommandHandler } from './global-command-handler';

export const Help = Case('help', (source: Discord.User | Discord.TextChannel) => ({ source }))

export const HelpCommandFactory = () => new GlobalCommandFactory(message => {
  const source = message.channel instanceof Discord.TextChannel ? message.channel : message.author
  if (message.content === '!help') {
    return Help(source)
  }
})

export const HelpCommandHandler = () => new GlobalCommandHandler(async command => {
  if (command.type === Help.type) {
    return Send(command.source, new HelpMessage())
  }
})