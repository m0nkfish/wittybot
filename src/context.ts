import * as Discord from 'discord.js';

export type Context = {
  client: Discord.Client
  config: {
    submitDurationSec: number
    voteDurationSec: number
    testMode?: boolean
  }
}
