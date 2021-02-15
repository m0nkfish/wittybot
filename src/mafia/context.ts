import * as Discord from 'discord.js';
import { Id } from '../id';
import { GuildContext } from '../context';

export class MafiaGameContext extends GuildContext {
  constructor(
    readonly guildCtx: GuildContext,
    readonly channel: Discord.TextChannel,
    readonly gameId: Id,
    readonly initiator: Discord.User
  ) {
    super(guildCtx.globalCtx, guildCtx.guild)
  }

  sameGame = (other: MafiaGameContext) => this.gameId === other.gameId

}
