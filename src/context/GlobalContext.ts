import * as Discord from 'discord.js';

export class GlobalContext {
  constructor(
    readonly client: Discord.Client,
    readonly config: { defaultSubmitDurationSec: number, testMode?: boolean }
  ) { }

  get inTestMode() { return !!this.config.testMode }
  get botUser() { return this.client.user! }
}