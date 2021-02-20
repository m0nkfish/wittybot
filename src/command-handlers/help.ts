import { Send } from '../actions'
import { GlobalCommandHandler, Help } from '../commands'
import { MafiaHelpMessage, MafiaHelpRolesMessage } from '../mafia/messages'
import { WittyHelpMessage } from '../witty/messages'

export const HelpCommandHandler = () => new GlobalCommandHandler(async command => {
  if (command.type === Help.type) {
    const message = command.subject === 'witty' ? new WittyHelpMessage()
      : command.subject === 'mafia' ? new MafiaHelpMessage()
        : command.subject === 'mafia roles' ? new MafiaHelpRolesMessage()
          : null

    if (message) {
      return Send(command.source, message)
    }
  }
})