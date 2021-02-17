import { Send } from '../actions'
import { Help, GlobalCommandHandler} from '../commands'
import { MafiaHelpMessage } from '../mafia/messages';
import { WittyHelpMessage } from '../witty/messages';

export const HelpCommandHandler = () => new GlobalCommandHandler(async command => {
  if (command.type === Help.type) {
    const message = command.subject === 'witty' ? new WittyHelpMessage()
    : command.subject === 'mafia' ? new MafiaHelpMessage()
    : null

    if (message) {
      return Send(command.source, message)
    }
  }
})