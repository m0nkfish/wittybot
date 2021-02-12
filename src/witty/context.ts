import * as Discord from 'discord.js';
import { Option } from 'fp-ts/Option'

import { Prompt } from './prompts';
import { Id } from '../id';
import { Scores } from './scores';
import { GuildContext } from '../context';

export type Round = {
  id: Id
  prompt: Prompt
  channel: Discord.TextChannel
  submissions: Map<Discord.User, {
    submission: string
    votes: Discord.User[]
    voted: boolean
  }>
  skipped: boolean
}

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
    new RoundContext(this, Id.create())

  sameGame = (other: WittyGameContext) => this.gameId === other.gameId
}

export class RoundContext extends WittyGameContext {
  constructor(
    readonly gameCtx: WittyGameContext,
    readonly roundId: Id
  ) {
    super(gameCtx.guildCtx, gameCtx.channel, gameCtx.gameId, gameCtx.initiator, gameCtx.rounds, gameCtx.timeoutSec, gameCtx.minPlayers, gameCtx.race)
  }

  sameRound = (other: RoundContext) => this.roundId === other.roundId
}