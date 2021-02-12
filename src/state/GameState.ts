import * as Discord from 'discord.js'
import { Command } from '../witty/commands';
import { Action } from '../witty/actions';

export type AnyGameState = GameState<any>

export type GameState<Context> = {
  readonly context: Context
  interpreter(message: Discord.Message): Command | undefined
  receive(command: Command): Action | undefined
}
