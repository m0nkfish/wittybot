import { AllWittyCommandHandlers } from '../witty/command-handlers';
import { HelpCommandHandler } from './help';
import { AllMafiaCommandHandlers } from '../mafia/command-handlers';
import { AllAdminCommandHandlers } from '../admin/command-handlers';

export const AllScopedCommandHandlers = () =>
  AllWittyCommandHandlers()
    .orElse(AllMafiaCommandHandlers())
    .orElse(AllAdminCommandHandlers())

export const AllGlobalCommandHandlers = () => HelpCommandHandler()