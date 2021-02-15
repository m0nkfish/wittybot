import { CommandFactory } from '../../commands';
import { MessageReceived, ReactionAdded } from '../../discord-events';
import { In } from '../../commands';
import { StartingState } from '../state';
import { GameStartedMessage } from '../messages/GameStartedMessage';

export const InFactory = () => CommandFactory.build.state(StartingState).process(((state, event) => {
  if (event.type === MessageReceived.type) {
    const {message} = event
    if (message.member && message.channel === state.context.channel && message.content === '!in') {
      return In(message.member)
    }
  } else if (event.type === ReactionAdded.type) {
    const {context} = event.message
    if (event.message instanceof GameStartedMessage && context && event.reaction.emoji.name === event.message.inReact) {
      const member = context.guild.member(event.user)
      if (member) {
        return In(member)
      }
    }
  }
}))
