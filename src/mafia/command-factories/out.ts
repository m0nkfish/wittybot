import { CommandFactory } from '../../commands';
import { MessageReceived, ReactionRemoved } from '../../discord-events';
import { Out } from '../../commands';
import { GameStartedMessage } from '../messages';
import { StartingState } from '../state';

export const OutFactory = () => CommandFactory.build.state(StartingState).process(((state, event) => {
  if (event.type === MessageReceived.type) {
    const {message} = event
    if (message.member && message.channel === state.context.channel && message.content === '!out') {
      return Out(message.member)
    }
  } else if (event.type === ReactionRemoved.type) {
      const { context } = event.message
      if (event.message instanceof GameStartedMessage && context && event.reaction.emoji.name === event.message.inReact) {
        const member = context.guild.member(event.user)
        if (member) {
          return Out(member)
        }
      }
    }
}))