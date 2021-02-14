import { AllWittyCommandHandlers } from '../witty/command-handlers';
import { AllWittyCommands } from '../witty/commands';
import { HelpCommandHandler } from './help';

export const AllCommandHandlers = AllWittyCommandHandlers
export const AllCommandFactories = AllWittyCommands

export const AllGlobalCommandHandlers = HelpCommandHandler