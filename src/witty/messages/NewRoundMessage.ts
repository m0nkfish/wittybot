import * as Discord from 'discord.js'
import { interval } from 'rxjs'
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

  private get baseContent() {
    const msg = new Discord.MessageEmbed()
      .setTitle(this.prompt.formatted)
      .setDescription([
        `Submit by sending a spoiler message (\`||whatever||\`, or \`/spoiler whatever\` on desktop) to this channel`,
        `**or** by DMing the bot (:point_up: on desktop just click the sender name)`
      ])

    if (this.prompt.type === 'caption') {
      msg.setImage(this.prompt.prompt)
    }

    return msg
  }

  private message = (remaining: Duration) =>
    this.baseContent
      .setFooter(`You have ${remaining.seconds} seconds to come up with an answer`)

  get content() {
    return this.message(this.submitDuration)
  }

  onSent = (msg: Discord.Message, getState: () => AnyGameState) => {
    interval(5000)
      .pipe(
        map(_ => getState()),
        takeWhile(s => s instanceof SubmissionState && s.context.roundId === this.roundId && s.remaining().isGreaterThan(0)),
        map(s => s as SubmissionState)
      )
      .subscribe(
        s => msg.edit(this.message(s.remaining())),
        () => msg.edit(this.baseContent.setFooter(`Time's up!`)),
        () => msg.edit(this.baseContent.setFooter(`Time's up!`)))
  }
}