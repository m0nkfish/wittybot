import * as Discord from 'discord.js';
import { Id } from '../id';
import { Scores } from './scores';
import { GuildContext } from '../context';
import { Round } from './round'

export class WittyGameContext extends GuildContext {
  constructor(
    readonly guildCtx: GuildContext,
    readonly channel: Discord.TextChannel,
    readonly gameId: Id,
    readonly initiator: Discord.User,
    readonly rounds: Round[],
    readonly timeoutSec: number,
    readonly minPlayers: number,
    readonly race: number
  ) {
    super(guildCtx.globalCtx, guildCtx.guild)
  }

  get scores() { return Scores.fromRounds(this.rounds) }

  addRound = (round: Round) =>
    new WittyGameContext(this.guildCtx, this.channel, this.gameId, this.initiator, [...this.rounds, round], this.timeoutSec, this.minPlayers, this.race)

  newRound = () =>
    new WittyRoundContext(this, Id.create())

  sameGame = (other: WittyGameContext) => this.gameId === other.gameId
}

export class WittyRoundContext extends WittyGameContext {
  constructor(
    readonly gameCtx: WittyGameContext,
    readonly roundId: Id
  ) {
    super(gameCtx.guildCtx, gameCtx.channel, gameCtx.gameId, gameCtx.initiator, gameCtx.rounds, gameCtx.timeoutSec, gameCtx.minPlayers, gameCtx.race)
  }

  sameRound = (other: WittyRoundContext) => this.roundId === other.roundId
}