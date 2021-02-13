import { Help } from './help'
import { WittyCommand } from '../witty/commands'

export type Command =
| WittyCommand
| ReturnType<typeof Help>