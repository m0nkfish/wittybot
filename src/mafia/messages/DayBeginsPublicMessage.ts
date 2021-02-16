import { MessageEmbed } from "discord.js";
import { Message } from "../../messages";
import { dayNumber, Emojis } from "./text";
import { MafiaGameContext } from '../context';

export class DayBeginsPublicMessage implements Message {
  constructor(
    readonly context: MafiaGameContext,
    readonly round: number) {}

  get content() {
    return new MessageEmbed()
      .setTitle(`${Emojis.day} Day ${dayNumber(this.round)} Begins!`)
  }
}