import { AllAdminCommandFactories } from '../admin/command-factories';
import { AllMafiaCommandFactories } from '../mafia/command-factories';
import { AllWittyCommandFactories } from '../witty/command-factories';
import { HelpCommandFactory } from './help';
import { NotifyFactory } from './notify';

export const AllScopedCommandFactories = () =>
  AllWittyCommandFactories()
    .combine(AllMafiaCommandFactories())
    .combine(AllAdminCommandFactories())

export const AllGlobalCommandFactories = () =>
  HelpCommandFactory()
    .combine(NotifyFactory())