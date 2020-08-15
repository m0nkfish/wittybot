import * as Discord from 'discord.js';

export type Round = {
  prompt: string
  submissions: Map<Discord.User, {
    submission: string
    votes: Discord.User[]
    voted: boolean
  }>
}

export type Context = {
  client: Discord.Client
  config: {
    submitDurationSec: number
    testMode?: boolean
  }
  rounds: Round[]
}
