import { GlobalContext } from './GlobalContext';
import * as Discord from 'discord.js';

export class GuildContext extends GlobalContext {
  constructor(
    readonly globalCtx: GlobalContext,
    readonly guild: Discord.Guild
  ) {
    super(globalCtx.client, globalCtx.config)
  }
}