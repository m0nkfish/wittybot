import * as Discord from 'discord.js';
import { Prompt } from './prompts';
import { Id } from './id';

export type Round = {
  id: Id,
  prompt: Prompt
  submissions: Map<Discord.User, {
    submission: string
    votes: Discord.User[]
    voted: boolean
  }>
}

export class Context {
  constructor(
    readonly client: Discord.Client,
    readonly config: { submitDurationSec: number, testMode?: boolean },
    readonly rounds: Round[]
  ) {}

  start = (channel: Discord.TextChannel, initiator: Discord.User) =>
    new RoundContext(this, channel, Id.create(), Id.create(), initiator)

  addRound = (round: Round) => new Context(this.client, this.config, [...this.rounds, round])

  get inTestMode() { return !!this.config.testMode }

  get botUser() { return this.client.user! }
}

export class RoundContext {
  constructor(
    readonly baseContext: Context,
    readonly channel: Discord.TextChannel,
    readonly gameId: Id,
    readonly roundId: Id,
    readonly initiator: Discord.User
  ) {
  }

  get rounds() { return this.baseContext.rounds }

  get config() { return this.baseContext.config }

  get inTestMode() { return this.baseContext.inTestMode }

  get botUser() { return this.baseContext.botUser }

  addRound = (round: Round) => new RoundContext(this.baseContext.addRound(round), this.channel, this.gameId, this.roundId, this.initiator)

  nextRound = () => new RoundContext(this.baseContext, this.channel, this.gameId, Id.create(), this.initiator)

  sameRound = (other: RoundContext) => this.roundId.value === other.roundId.value
}