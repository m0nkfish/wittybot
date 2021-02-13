import * as Discord from 'discord.js'
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
    readonly voteDurationSec: number) {
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

  private message = (remainingSec: number, voters: Discord.User[]) =>
    this.baseContent
      .setFooter(`You have ${remainingSec} seconds. Still left to vote: ${this.users.filter(u => !voters.some(v => v == u)).map(u => memberName(this.context.guild, u)).join(', ')}`)

  get content() {
    return this.message(this.voteDurationSec, [])
  }

  onSent = (msg: Discord.Message, getState: () => AnyGameState) => {
    let remainingSec = this.voteDurationSec
    const interval = setInterval(() => {
      remainingSec -= 5
      const state = getState()
      if (remainingSec > 0 && state instanceof VotingState && state.context.sameRound(this.context)) {
        msg.edit(this.message(remainingSec, Array.from(state.votes.keys())))
      } else {
        clearInterval(interval)
        msg.edit(this.baseContent.setFooter(`Voting over!`))
      }
    }, 5000)
  }
}
