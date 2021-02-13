import * as Discord from 'discord.js';
import { Duration } from '../duration';

export class GlobalContext {
  constructor(
    readonly client: Discord.Client,
    readonly config: { defaultSubmitDuration: Duration, testMode?: boolean }
  ) { }

  get inTestMode() { return !!this.config.testMode }
  get botUser() { return this.client.user! }
}