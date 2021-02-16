import { Message } from "../../messages";
import * as Discord from 'discord.js';
import { Emojis, nightNumber } from "./text";
import { Observable, combineLatest, interval } from 'rxjs';
import { AnyGameState } from "../../state";
import { map, takeWhile } from 'rxjs/operators';
import { NightState } from "../state";
import { Duration } from "../../duration";
import { NightDuration } from "../constants";
import { MafiaGameContext } from "../context";

export class NightBeginsPublicMessage implements Message {
  constructor(readonly context: MafiaGameContext, readonly round: number) { }

  get content() {
    return new Discord.MessageEmbed()
      .setTitle(`${Emojis.night} Night ${nightNumber(this.round)} Begins!`)
      .setDescription([
        `Villagers, you must wait until morning and hope you survive the night!`,
        `Everyone else, you will be DMed with your actions...`
      ])
      .setFooter(this.footer(NightDuration))
  }

  footer = (remaining: Duration) => `${remaining.seconds} seconds remaining`

  onSent = (msg: Discord.Message, stateStream: Observable<AnyGameState>) => {
    combineLatest([stateStream, interval(5000)])
      .pipe(
        map(([s]) => s),
        takeWhile(s => s instanceof NightState && s.remaining().isGreaterThan(0)),
        map(s => s as NightState)
      )
      .subscribe(
        s => msg.edit({ embed: msg.embeds[0].setFooter(this.footer(s.remaining())) }),
        () => msg.edit({ embed: msg.embeds[0].setFooter('') }),
        () => msg.edit({ embed: msg.embeds[0].setFooter('') }))
  }
}