import * as Discord from 'discord.js'
import { interval, Observable, combineLatest } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators'

import  { Duration } from '../../duration'
import { Prompt } from '../prompts';
import { VotingState } from '../state';
import { shuffle } from 'random-js';
import { mt } from '../../random';
import { Message, memberName } from '../../messages'
import { WittyRoundContext } from '../context';
import { AnyGameState } from '../../state';

export class VoteMessage implements Message {
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

  private get baseContent() {
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

    if (this.prompt.type === 'caption') {
      msg.setImage(this.prompt.prompt)
    }

    return msg
  }

  private message = (remaining: Duration, voters: Discord.User[]) =>
    this.baseContent
      .setFooter(`You have ${remaining.seconds} seconds. Still left to vote: ${this.users.filter(u => !voters.some(v => v == u)).map(u => memberName(this.context.guild, u)).join(', ')}`)

  get content() {
    return this.message(this.voteDuration, [])
  }

  onSent = (msg: Discord.Message, stateStream: Observable<AnyGameState>) => {
    combineLatest([stateStream, interval(5000)])
      .pipe(
        map(([s]) => s),
        takeWhile(s => s instanceof VotingState && s.context.sameRound(this.context) && s.remaining().isGreaterThan(0)),
        map(s => s as VotingState)
      )
      .subscribe(
        s => msg.edit(this.message(s.remaining(), Array.from(s.votes.keys()))),
        () => this.baseContent.setFooter(`Voting over!`),
        () => this.baseContent.setFooter(`Voting over!`))
  }
}
