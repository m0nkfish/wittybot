import * as Discord from 'discord.js';
import { GuildContext } from '../context';
import { Id } from '../id';

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

  firstRound = () => new MafiaRoundContext(this, 1)
}

export class MafiaRoundContext extends MafiaGameContext {
  constructor(
    readonly gameCtx: MafiaGameContext,
    readonly round: number
  ) {
    super(gameCtx.guildCtx, gameCtx.channel, gameCtx.gameId, gameCtx.initiator)
  }

  sameRound = (other: MafiaRoundContext) => this.sameGame(other) && this.round === other.round

  nextRound = () => new MafiaRoundContext(this.gameCtx, this.round + 1)

  get nightNumber() {
    return Math.ceil(this.round / 2)
  }

  get dayNumber() {
    return Math.ceil(this.round / 2)
  }
}
