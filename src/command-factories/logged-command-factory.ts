import { log, loggableError } from '../log';
import { GlobalCommandFactory } from '../commands';
import { DiscordEvent, MessageReceived, ReactionAdded, ReactionRemoved } from '../discord-events';

export const LoggedCommandFactory = (factory: GlobalCommandFactory) =>
  new GlobalCommandFactory(event => {
    try {
      return factory.process(event)
    } catch (err) {
      log.error('error:command_factory', loggableError(err), loggableEvent(event))
    }
  })

function loggableEvent(event: DiscordEvent) {
  switch (event.type) {
    case MessageReceived.type:
      return { type: event.type, message_content: event.message.content }
    case ReactionAdded.type:
    case ReactionRemoved.type:
      return { type: event.type, emoji: event.reaction.emoji.name }
  }
}