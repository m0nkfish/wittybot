import * as Discord from 'discord.js'
import { Case } from '../../case'
import { CommandFactory } from '../../commands';

export const Unnotify = Case('unnotify-me', (member: Discord.GuildMember) => ({ member }))

export const UnnotifyFactory = () => new CommandFactory((state, message) => {
  if (message.content === '!unnotify' && message.member) {
    return Unnotify(message.member)
  }
})