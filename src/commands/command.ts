import * as Discord from 'discord.js';
import { AdminCommand } from '../admin/commands';
import { Case } from '../case';
import { MafiaCommand } from '../mafia/commands';
import { WittyCommand } from '../witty/commands';
import { Help } from './help';
import { Notify } from './notify';

export type ScopedCommand =
| WittyCommand
| MafiaCommand
| AdminCommand

export const ScopedCommand = Case('scoped-command', (guild: Discord.Guild, scopedCommand: ScopedCommand) => ({ guild, scopedCommand }))

export type Command =
| ReturnType<typeof ScopedCommand>
| ReturnType<typeof Help>
| ReturnType<typeof Notify>