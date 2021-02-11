import * as Discord from 'discord.js'
import { Command } from '../commands';
import { Action } from '../actions';
import { RoundContext, GameContext } from '../context';
import { GuildContext } from '../../context'

export type AnyGameState = GameState<GuildContext | GameContext | RoundContext>

export type GameState<Context> = {
  readonly context: Context
  interpreter(message: Discord.Message): Command | undefined
  receive(command: Command): Action | undefined
}
