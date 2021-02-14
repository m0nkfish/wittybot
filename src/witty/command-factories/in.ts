import * as Discord from 'discord.js';
import { CommandFactory } from '../../commands';
import { In } from '../commands';
import { StartingState } from '../state';

export const InFactory = () => new CommandFactory((state, message) => {
  if (state instanceof StartingState && message.member && message.channel === state.context.channel && message.content === '!in') {
    return In(message.member)
  }
})
