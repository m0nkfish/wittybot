import * as Discord from 'discord.js';
import { GuildContext } from '../context';
import { Duration } from '../duration';
import { Id } from '../id';
import { dayNumber, nightNumber } from './messages/text';

export type MafiaSettings = {
  reveals: boolean
  dayDuration: Duration
  nightDuration: Duration
  minPlayers: number
}

export class MafiaGameContext extends GuildContext {
  constructor(
    readonly guildCtx: GuildContext,
    readonly settings: MafiaSettings,
    readonly channel: Discord.TextChannel,
    readonly gameId: Id,
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
    super(gameCtx.guildCtx, gameCtx.settings, gameCtx.channel, gameCtx.gameId)
  }

  sameRound = (other: MafiaRoundContext) => this.sameGame(other) && this.round === other.round

  nextRound = () => new MafiaRoundContext(this.gameCtx, this.round + 1)

  get nightNumber() { return nightNumber(this.round) }
  get dayNumber() { return dayNumber(this.round) }
}
