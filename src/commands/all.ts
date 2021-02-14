import { AllWittyCommandHandlers } from '../witty/command-handlers';
import { AllWittyCommandFactories } from '../witty/command-factories';
import { HelpCommandHandler, HelpCommandFactory } from './help';

export const AllScopedCommandHandlers = () => AllWittyCommandHandlers()
export const AllScopedCommandFactories = () => AllWittyCommandFactories()

export const AllGlobalCommandHandlers = () => HelpCommandHandler()
export const AllGlobalCommandFactories = () => HelpCommandFactory()