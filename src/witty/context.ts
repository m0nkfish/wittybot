import * as Discord from 'discord.js';
import { Option } from 'fp-ts/Option'

import { Prompt } from './prompts';
import { Id } from './id';
import { Scores } from './scores';

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

export class GlobalContext {
  constructor(
    readonly client: Discord.Client,
    readonly config: { defaultSubmitDurationSec: number, testMode?: boolean }
  ) {}

  get inTestMode() { return !!this.config.testMode }
  get botUser() { return this.client.user! }
}

export class GuildContext {
  constructor(
    readonly globalCtx: GlobalContext,
    readonly guild: Discord.Guild
  ) { }

  get config() { return this.globalCtx.config }
  get inTestMode() { return this.globalCtx.inTestMode }

  newGame = (channel: Discord.TextChannel, initiator: Discord.User, timeoutSec: number, minPlayers: number, race: Option<number>) =>
    new GameContext(this, channel, Id.create(), initiator, [], timeoutSec, minPlayers, race)
}

export class GameContext {
  constructor(
    readonly guildCtx: GuildContext,
    readonly channel: Discord.TextChannel,
    readonly gameId: Id,
    readonly initiator: Discord.User,
    readonly rounds: Round[],
    readonly timeoutSec: number,
    readonly minPlayers: number,
    readonly race: Option<number>
  ) { }

  get globalCtx() { return this.guildCtx.globalCtx }
  get config() { return this.guildCtx.config }
  get guild() { return this.guildCtx.guild }
  get inTestMode() { return this.guildCtx.inTestMode }

  get scores() { return Scores.fromRounds(this.rounds) }

  addRound = (round: Round) =>
    new GameContext(this.guildCtx, this.channel, this.gameId, this.initiator, [...this.rounds, round], this.timeoutSec, this.minPlayers, this.race)

  newRound = () =>
    new RoundContext(this, Id.create())
}

export class RoundContext {
  constructor(
    readonly gameCtx: GameContext,
    readonly roundId: Id
  ) {
  }

  get globalCtx() { return this.gameCtx.globalCtx }
  get guildCtx() { return this.gameCtx.guildCtx }
  get rounds() { return this.gameCtx.rounds }
  get config() { return this.gameCtx.config }
  get inTestMode() { return !!this.config.testMode }
  get botUser() { return this.globalCtx.botUser }
  get channel() { return this.gameCtx.channel }
  get initiator() { return this.gameCtx.initiator }
  get guild() { return this.gameCtx.guild }
  get minPlayers() { return this.gameCtx.minPlayers }
  get race() { return this.gameCtx.race }

  sameRound = (other: RoundContext) => this.roundId === other.roundId
}