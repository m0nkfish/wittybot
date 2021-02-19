import * as Discord from 'discord.js';
import { Observable } from 'rxjs';
import { endWith, map, scan, takeWhile } from 'rxjs/operators';
import { Duration } from "../../duration";
import { EmbedContent, Emojis, MessageContent, setFooter, StateStreamMessage } from '../../messages';
import { AnyGameState } from "../../state";
import { pulse } from '../../util';
import { MafiaRoundContext } from '../context';
import { NightState } from "../state";

export class NightBeginsPublicMessage implements StateStreamMessage {
  readonly type = 'state-stream'
  constructor(readonly context: MafiaRoundContext) { }

  get content(): EmbedContent {
    return new Discord.MessageEmbed()
      .setTitle(`${Emojis.night} Night ${this.context.nightNumber} Begins!`)
      .setDescription([
        `Villagers, you must wait until morning and hope you survive the night!`,
        `Everyone else, you will be DMed with your actions...`
      ])
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