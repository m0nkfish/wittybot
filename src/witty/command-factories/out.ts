import * as Discord from 'discord.js';
import { CommandFactory } from '../../commands';
import { MessageReceived } from '../../discord-events';
import { Out } from '../commands';
import { StartingState } from '../state';

export const OutFactory = () => CommandFactory.build.state(StartingState).event(MessageReceived).process(((state, {message}) => {
  if (message.member && message.channel === state.context.channel && message.content === '!out') {
    return Out(message.member)
  }
}))