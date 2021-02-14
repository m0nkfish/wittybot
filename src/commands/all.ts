import { AllWittyCommandHandlers } from '../witty/command-handlers';
import { AllWittyCommands } from '../witty/commands';
import { HelpCommandHandler, HelpCommandFactory } from './help';

export const AllScopedCommandHandlers = AllWittyCommandHandlers
export const AllScopedCommandFactories = AllWittyCommands

export const AllGlobalCommandHandlers = HelpCommandHandler
export const AllGlobalCommandFactories = HelpCommandFactory