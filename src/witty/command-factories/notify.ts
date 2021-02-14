import * as Discord from 'discord.js'
import { CommandFactory } from '../../commands';
import { Notify } from '../commands';

export const NotifyFactory = () => new CommandFactory((state, message) => {
  if (message.content === '!notify' && message.member) {
    return Notify(message.member)
  }
})