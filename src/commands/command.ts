import { Help } from './help'
import { WittyCommand } from '../witty/commands'
import { Case } from '../case'
import * as Discord from 'discord.js';

export type ScopedCommand =
| WittyCommand

export const ScopedCommand = Case('scoped-command', (guild: Discord.Guild, scopedCommand: ScopedCommand) => ({ guild, scopedCommand }))

export type Command =
| ReturnType<typeof ScopedCommand>
| ReturnType<typeof Help>