import * as Discord from 'discord.js';
import { BehaviorSubject, Observable } from 'rxjs';

import { AnyGameState } from './state/GameState';
import { getOrSet } from './util';
import { IdleState } from './state';
import { GlobalContext, GuildContext } from './context';

export class GuildStates {
  guildStreams = new Map<Discord.Guild, BehaviorSubject<AnyGameState>>()

  constructor(readonly context: GlobalContext) { }

  private getSubject = (guild: Discord.Guild): BehaviorSubject<AnyGameState> =>
    getOrSet(this.guildStreams, guild, () => new BehaviorSubject(new IdleState(new GuildContext(this.context, guild))))

  getStream = (guild: Discord.Guild): Observable<AnyGameState> =>
    this.getSubject(guild).asObservable()

  getState = (guild: Discord.Guild): AnyGameState =>
    this.getSubject(guild).value

  setState = (guild: Discord.Guild, state: AnyGameState) => {
    this.getSubject(guild).next(state)
  }

  get all(): [Discord.Guild, AnyGameState][] {
    return Array.from(this.guildStreams.entries()).map(([g, s]) => [g, s.value])
  }
}