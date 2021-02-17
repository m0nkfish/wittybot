import * as Discord from 'discord.js'
import { interval, Observable, combineLatest, concat, of } from 'rxjs';
import { map, scan, takeWhile } from 'rxjs/operators'

import { Prompt } from '../prompts';
import { SubmissionState } from '../state';
import { AnyGameState } from '../../state';
import { Message } from '../../messages'
import { Duration } from '../../duration';
import { WittyRoundContext } from '../context';
import { EmbedContent, MessageContent, setFooter, StateStreamMessage } from '../../messages/Message';

export class NewRoundMessage implements StateStreamMessage {
  readonly type = 'state-stream'

  constructor(
    readonly context: WittyRoundContext,
    readonly prompt: Prompt,
    readonly submitDuration: Duration,
  ) { }

  get content(): EmbedContent {
    const msg = new Discord.MessageEmbed()
      .setTitle(this.prompt.formatted)
      .setDescription([
        `Submit by sending a spoiler message (\`||whatever||\`, or \`/spoiler whatever\` on desktop) to this channel`,
        `**or** by DMing the bot (:point_up: on desktop just click the sender name)`
      ])
      .setFooter(this.footer(this.submitDuration))

    if (this.prompt.type === 'caption') {
      msg.setImage(this.prompt.prompt)
    }
    
    return msg
  }

  footer = (remaining: Duration) =>
    `You have ${remaining.seconds} seconds to come up with an answer`

  content$ = (stateStream: Observable<AnyGameState>): Observable<MessageContent> =>
    combineLatest([stateStream!, interval(5000)])
      .pipe(
        map(([s]) => s),
        takeWhile(s => s instanceof SubmissionState && s.context.sameRound(this.context) && s.remaining().isGreaterThan(0)),
        map(s => s as SubmissionState),
        map(s => setFooter(this.footer(s.remaining()))),
        o => concat(o, of(setFooter(`Time's up!`))),
        scan((content, update) => update(content), this.content)
      )
}