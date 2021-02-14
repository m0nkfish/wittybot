import { Send } from '../actions'
import { Help, GlobalCommandHandler} from '../commands'
import { HelpMessage } from '../messages'

export const HelpCommandHandler = () => new GlobalCommandHandler(async command => {
  if (command.type === Help.type) {
    return Send(command.source, new HelpMessage())
  }
})