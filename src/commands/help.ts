import * as Discord from 'discord.js'
import { Send } from '../actions'
import { Case } from '../case'
import { HelpMessage } from '../messages'
import { Command } from './command'

export const Help = Case('help', (source: Discord.User | Discord.TextChannel) => ({ source }))

export const HelpCommandHandler = (command: Command) => {
  if (command.type === Help.type) {
    return Send(command.source, new HelpMessage())
  }
}