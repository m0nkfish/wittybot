import * as Discord from 'discord.js';
import { Observable } from 'rxjs';
import { endWith, map, scan, takeWhile } from 'rxjs/operators';

import { Emojis, nightNumber } from "./text";
import { AnyGameState } from "../../state";
import { NightState } from "../state";
import { Duration } from "../../duration";
import { NightDuration } from "../constants";
import { MafiaGameContext } from "../context";
import { MessageContent, StateStreamMessage, setFooter, EmbedContent } from '../../messages';
import { pulse } from '../../util';

export class NightBeginsPublicMessage implements StateStreamMessage {
  readonly type = 'state-stream'
  constructor(readonly context: MafiaGameContext, readonly round: number) { }

  get content(): EmbedContent {
    return new Discord.MessageEmbed()
      .setTitle(`${Emojis.night} Night ${nightNumber(this.round)} Begins!`)
      .setDescription([
        `Villagers, you must wait until morning and hope you survive the night!`,
        `Everyone else, you will be DMed with your actions...`
      ])
      .setFooter(this.footer(NightDuration))
  }

  footer = (remaining: Duration) => `${remaining.seconds} seconds remaining`

  content$ = (stateStream: Observable<AnyGameState>): Observable<MessageContent> =>
    pulse(stateStream, Duration.seconds(5))
      .pipe(
        takeWhile(s => s instanceof NightState && s.remaining().isGreaterThan(0)),
        map(s => s as NightState),
        map(s => setFooter(this.footer(s.remaining()))),
        endWith(setFooter(`Time's up!`)),
        scan((content, update) => update(content), this.content)
      )

}