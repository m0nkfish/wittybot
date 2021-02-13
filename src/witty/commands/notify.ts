import * as Discord from 'discord.js'
import { Case } from '../../case'
import { CommandFactory } from '../../commands';

export const Notify = Case('notify-me', (member: Discord.GuildMember) => ({ member }))

export const NotifyFactory = new CommandFactory((state, message) => {
  if (message.content === '!notify' && message.member) {
    return Notify(message.member)
  }
})