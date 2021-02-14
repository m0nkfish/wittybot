import * as Discord from 'discord.js'
import { CommandFactory } from '../../commands';
import { Unnotify } from '../commands';

export const UnnotifyFactory = () => new CommandFactory((state, message) => {
  if (message.content === '!unnotify' && message.member) {
    return Unnotify(message.member)
  }
})