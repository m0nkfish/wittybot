import * as Discord from 'discord.js';

export type Context = {
  client: Discord.Client
  config: {
    submitDurationSec: 60
    voteDurationSec: 30
  }
}
