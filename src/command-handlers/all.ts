import { AllWittyCommandHandlers } from '../witty/command-handlers';
import { HelpCommandHandler } from './help';
import { AllMafiaCommandHandlers } from '../mafia/command-handlers/all';

export const AllScopedCommandHandlers = () =>
  AllWittyCommandHandlers()
    .orElse(AllMafiaCommandHandlers())
    
export const AllGlobalCommandHandlers = () => HelpCommandHandler()