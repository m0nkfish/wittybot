import * as Discord from 'discord.js';
import { DiscordEvent } from '../discord-events';
import { Command } from './command';

export class GlobalCommandFactory {
  constructor(readonly process: (event: DiscordEvent) => Command | undefined) {}

  combine = (other: GlobalCommandFactory) =>
    new GlobalCommandFactory(evt => this.process(evt) ?? other.process(evt))
}