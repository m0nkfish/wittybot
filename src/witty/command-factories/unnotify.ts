import * as Discord from 'discord.js'
import { CommandFactory } from '../../commands';
import { MessageReceived } from '../../discord-events';
import { Unnotify } from '../commands';

export const UnnotifyFactory = () => CommandFactory.build.event(MessageReceived).process(((_, { message }) => {
  if (message.content === '!unnotify' && message.member) {
    return Unnotify(message.member)
  }
}))