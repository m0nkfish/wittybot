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

export class GuildContext extends GlobalContext {
  constructor(
    readonly globalCtx: GlobalContext,
    readonly guild: Discord.Guild
  ) {
    super(globalCtx.client, globalCtx.config)
  }

  newGame = (channel: Discord.TextChannel, initiator: Discord.User, timeoutSec: number, minPlayers: number, race: Option<number>) =>
    new GameContext(this, channel, Id.create(), initiator, [], timeoutSec, minPlayers, race)
}

export class GameContext extends GuildContext {
  constructor(
    readonly guildCtx: GuildContext,
    readonly channel: Discord.TextChannel,
    readonly gameId: Id,
    readonly initiator: Discord.User,
    readonly rounds: Round[],
    readonly timeoutSec: number,
    readonly minPlayers: number,
    readonly race: Option<number>
  ) {
    super(guildCtx.globalCtx, guildCtx.guild)
  }

  get scores() { return Scores.fromRounds(this.rounds) }

  addRound = (round: Round) =>
    new GameContext(this.guildCtx, this.channel, this.gameId, this.initiator, [...this.rounds, round], this.timeoutSec, this.minPlayers, this.race)

  newRound = () =>
    new RoundContext(this, Id.create())
}

export class RoundContext extends GameContext {
  constructor(
    readonly gameCtx: GameContext,
    readonly roundId: Id
  ) {
    super(gameCtx.guildCtx, gameCtx.channel, gameCtx.gameId, gameCtx.initiator, gameCtx.rounds, gameCtx.timeoutSec, gameCtx.minPlayers, gameCtx.race)
  }

  sameRound = (other: RoundContext) => this.roundId === other.roundId
}