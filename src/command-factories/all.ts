import { AllWittyCommandHandlers } from '../witty/command-handlers';
import { AllWittyCommandFactories } from '../witty/command-factories';
import { HelpCommandFactory } from './help';

export const AllScopedCommandFactories = () => AllWittyCommandFactories()
export const AllGlobalCommandFactories = () => HelpCommandFactory()