import { AllWittyCommandFactories } from '../witty/command-factories';
import { HelpCommandFactory } from './help';
import { AllMafiaCommandFactories } from '../mafia/command-factories/all';

export const AllScopedCommandFactories = () =>
  AllWittyCommandFactories()
    .combine(AllMafiaCommandFactories())

export const AllGlobalCommandFactories = () => HelpCommandFactory()