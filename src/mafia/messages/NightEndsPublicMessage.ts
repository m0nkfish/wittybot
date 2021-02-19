import { MessageEmbed } from "discord.js";
import { EmbedContent, Emojis, mention, StaticMessage } from "../../messages";
import { MafiaRoundContext } from '../context';
import { Player } from '../model/Player';
import { roleText } from './text';

export class NightEndsPublicMessage implements StaticMessage {
  readonly type = 'static'

  constructor(
    readonly context: MafiaRoundContext,
    readonly killed: Player[]
  ) { }

  get content(): EmbedContent {
    return new MessageEmbed()
      .setTitle(`${Emojis.sunrise} Night ${this.context.nightNumber} Ends...`)
      .setDescription(this.description)
  }

  get description() {
    if (this.killed.length === 0) {
      return `Nobody died last night!`
    }

    const display = (p: Player) => {
      let basic = `${Emojis.skull} ${mention(p.user)}`
      if (this.context.settings.reveals) {
        basic += ` (${roleText(p.role).name})`
      }
      return basic
    }

    return [
      `Deaths last night:`,
      ...this.killed.map(display)
    ]
  }
}