import * as Discord from 'discord.js';
import { AnyGameState } from './state/GameState';
import { getOrSet } from './util';
import { IdleState } from './state';
import { GlobalContext, GuildContext } from './context';

export class GuildStates {
  guildStates: Map<Discord.Guild, AnyGameState>

  constructor(readonly context: GlobalContext) {
    this.guildStates = new Map()
  }

  getState = (guild: Discord.Guild): AnyGameState =>
    getOrSet(this.guildStates, guild, () => new IdleState(new GuildContext(this.context, guild)))

  setState = (guild: Discord.Guild, state: AnyGameState) =>
    this.guildStates.set(guild, state)

  get all() {
    return Array.from(this.guildStates.entries())
  }
}