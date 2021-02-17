import { AllWittyCommandFactories } from '../witty/command-factories';
import { HelpCommandFactory } from './help';
import { AllMafiaCommandFactories } from '../mafia/command-factories';
import { AllAdminCommandFactories } from '../admin/command-factories';

export const AllScopedCommandFactories = () =>
  AllWittyCommandFactories()
    .combine(AllMafiaCommandFactories())
    .combine(AllAdminCommandFactories())

export const AllGlobalCommandFactories = () => HelpCommandFactory()