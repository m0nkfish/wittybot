import { AllAdminCommandHandlers } from '../admin/command-handlers';
import { AllMafiaCommandHandlers } from '../mafia/command-handlers';
import { AllWittyCommandHandlers } from '../witty/command-handlers';
import { HelpCommandHandler } from './help';
import { NotifyHandler } from './notify';

export const AllScopedCommandHandlers = () =>
  AllWittyCommandHandlers()
    .orElse(AllMafiaCommandHandlers())
    .orElse(AllAdminCommandHandlers())

export const AllGlobalCommandHandlers = () =>
  HelpCommandHandler()
    .orElse(NotifyHandler())