import * as Discord from 'discord.js';
import { Command } from './command';

export class GlobalCommandFactory {
  constructor(readonly process: (message: Discord.Message) => Command | undefined) {}

  combine = (other: GlobalCommandFactory) =>
    new GlobalCommandFactory(msg => this.process(msg) ?? other.process(msg))
}