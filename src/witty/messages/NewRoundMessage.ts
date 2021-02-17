import * as Discord from 'discord.js'
import { interval, Observable, combineLatest, concat, of } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators'

import { Prompt } from '../prompts';
import { SubmissionState } from '../state';
import { AnyGameState } from '../../state';
import { Id } from '../../id';
import { Message } from '../../messages'
import { Duration } from '../../duration';

export class NewRoundMessage implements Message {
  constructor(
    readonly roundId: Id,
    readonly prompt: Prompt,
    readonly botUser: Discord.User,
    readonly submitDuration: Duration
  ) { }

  get content() {
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

  reactiveMessage = (stateStream?: Observable<AnyGameState>) =>
    combineLatest([stateStream!, interval(5000)])
      .pipe(
        map(([s]) => s),
        takeWhile(s => s instanceof SubmissionState && s.context.roundId === this.roundId && s.remaining().isGreaterThan(0)),
        map(s => s as SubmissionState),
        map(s => ({
          footer: this.footer(s.remaining())
        })),
        o => concat(o, of({ footer: `Time's up!` }))
      )
}