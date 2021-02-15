import * as Discord from 'discord.js'
import { IdleState } from '../../state/IdleState';

import { CommandFactory } from '../../commands';
import { Begin } from '../commands';
import { MessageReceived } from '../../discord-events';

export const BeginFactory = () => CommandFactory.build.state(IdleState).event(MessageReceived).process(((_, { message }) => {
  if (message.channel instanceof Discord.TextChannel && /^!mafia\b/.test(message.content)) {
    return Begin(message.author, message.channel)
  }
}))
