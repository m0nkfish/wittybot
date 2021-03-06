import * as Discord from 'discord.js'
import { Observable } from 'rxjs';
import { endWith, map, scan, takeWhile } from 'rxjs/operators'

import  { Duration } from '../../duration'
import { Prompt } from '../prompts';
import { VotingState } from '../state';
import { shuffle } from 'random-js';
import { mt } from '../../random';
import { memberName } from '../../messages'
import { WittyRoundContext } from '../context';
import { AnyGameState } from '../../state';
import { MessageContent, StateStreamMessage, setFooter, EmbedContent } from '../../messages/Message';
import { pulse } from '../../util';

export class VoteMessage implements StateStreamMessage {
  readonly type = 'state-stream'

  constructor(
    readonly context: WittyRoundContext,
    readonly prompt: Prompt,
    readonly submissions: Array<{ user: Discord.User, submission: string }>,
    readonly botUser: Discord.User,
    readonly voteDuration: Duration) {
    this.users = [...submissions.map(x => x.user)]
    shuffle(mt, this.users)
  }

  private readonly users: Discord.User[]

  get content(): EmbedContent {
    const msg = new Discord.MessageEmbed()
      .setTitle(`:timer: Time's up!`)
      .setDescription([
        this.prompt.formatted,
        ``,
        ...this.submissions.map((x, i) => `${i + 1}. ${x.submission}`),
        ``,
        `Vote for your favourite by sending a spoiler message to this channel`,
        `**or** by DMing the bot with the entry number`
      ])
      .setFooter(this.footer(this.voteDuration, []))

    if (this.prompt.type === 'caption') {
      msg.setThumbnail(this.prompt.prompt)
    }

    return msg
  }

  footer = (remaining: Duration, voters: Discord.User[]) =>
    `You have ${remaining.seconds} seconds. Still left to vote: ${this.users.filter(u => !voters.some(v => v == u)).map(u => memberName(this.context.guild, u)).join(', ')}`

  content$ = (stateStream: Observable<AnyGameState>): Observable<MessageContent> =>
    pulse(stateStream, Duration.seconds(5))
      .pipe(
        takeWhile(s => s instanceof VotingState && s.context.sameRound(this.context) && s.remaining().isGreaterThan(0)),
        map(s => s as VotingState),
        map(s => setFooter(this.footer(s.remaining(), Array.from(s.votes.keys())))),
        endWith(setFooter(`Time's up!`)),
        scan((content, update) => update(content), this.content)
      )
}
