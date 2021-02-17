import { CommandFactory, Start } from '../../commands';
import { StartingState } from '../state/StartingState';
import { MessageReceived } from '../../discord-events';

export const StartFactory = () => CommandFactory.build.state(StartingState).event(MessageReceived)
  .process((state, {message}) => {
    if (message.channel === state.context.channel && message.content === '!start' && state.isInterested(message.author)) {
      return Start()
    }
  })