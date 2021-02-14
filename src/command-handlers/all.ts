import { AllWittyCommandHandlers } from '../witty/command-handlers';
import { HelpCommandHandler } from './help';

export const AllScopedCommandHandlers = () => AllWittyCommandHandlers()
export const AllGlobalCommandHandlers = () => HelpCommandHandler()