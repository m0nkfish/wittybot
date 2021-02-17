import { Help } from './help'
import { Case } from '../case'
import * as Discord from 'discord.js';
import { MafiaCommand } from '../mafia/commands';
import { WittyCommand } from '../witty/commands'
import { AdminCommand } from '../admin/commands';

export type ScopedCommand =
| WittyCommand
| MafiaCommand
| AdminCommand

export const ScopedCommand = Case('scoped-command', (guild: Discord.Guild, scopedCommand: ScopedCommand) => ({ guild, scopedCommand }))

export type Command =
| ReturnType<typeof ScopedCommand>
| ReturnType<typeof Help>