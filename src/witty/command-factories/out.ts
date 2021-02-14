import * as Discord from 'discord.js';
import { CommandFactory } from '../../commands';
import { Out } from '../commands';
import { StartingState } from '../state';

export const OutFactory = () => new CommandFactory((state, message) => {
  if (state instanceof StartingState && message.member && message.channel === state.context.channel && message.content === '!out') {
    return Out(message.member)
  }
})
