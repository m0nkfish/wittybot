import * as Discord from 'discord.js';
import { CommandFactory } from '../../commands';
import { MessageReceived } from '../../discord-events';
import { In } from '../commands';
import { StartingState } from '../state';

export const InFactory = () => CommandFactory.build.state(StartingState).event(MessageReceived).process(((state, { message }) => {
  if (message.member && message.channel === state.context.channel && message.content === '!in') {
    return In(message.member)
  }
}))
