import { log, loggableError } from '../log';
import { GlobalCommandFactory } from './global-command-factory';

export const LoggedCommandFactory = (factory: GlobalCommandFactory) =>
  new GlobalCommandFactory(message => {
    try {
      return factory.process(message)
    } catch (err) {
      log.error('error:command_factory', loggableError(err), { message_content: message.content })
    }
  })