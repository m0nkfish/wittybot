import * as Discord from 'discord.js';
import { MessageEmbed } from "discord.js";
import { EmbedContent, mention, StaticMessage } from "../../messages";
import { MafiaRoundContext } from '../context';
import { Emojis } from './text';

export class NightEndsPublicMessage implements StaticMessage {
  readonly type = 'static'

  constructor(
    readonly context: MafiaRoundContext,
    readonly killed: Discord.User[]
  ) { }

  get content(): EmbedContent {
    return new MessageEmbed()
      .setTitle(`${Emojis.sunrise} Night ${this.context.nightNumber} Ends...`)
      .setDescription(this.description)
  }

  get description() {
    if (this.killed.length) {
      return `Nobody died last night!`
    }

    return [
      `Deaths last night:`,
      ...this.killed.map(x => `${Emojis.skull} ${mention(x)}`)
    ]
  }
}