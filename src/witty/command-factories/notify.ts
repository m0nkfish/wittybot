import * as Discord from 'discord.js'
import { CommandFactory } from '../../commands';
import { MessageReceived } from '../../discord-events';
import { Notify } from '../commands';

export const NotifyFactory = () => CommandFactory.build.event(MessageReceived).process(((_, { message }) => {
  if (message.content === '!notify' && message.member) {
    return Notify(message.member)
  }
}))