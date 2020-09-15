import * as Discord from 'discord.js'
import { Prompt } from '../prompts';
import { AnyGameState, VotingState } from '../state';
import { Id } from '../id';
import { shuffle } from 'random-js';
import { mt } from '../random';
import { Message } from './index'

export class VoteMessage implements Message {
  constructor(
    readonly roundId: Id,
    readonly prompt: Prompt,
    readonly submissions: Array<{ user: Discord.User, submission: string }>,
    readonly botUser: Discord.User,
    readonly voteDurationSec: number) {
    this.users = [...submissions.map(x => x.user)]
    shuffle(mt, this.users)
  }


  private readonly users: Discord.User[]

  private readonly baseContent = new Discord.MessageEmbed()
    .setTitle(`:timer: Time's up!`)
    .setDescription([
      this.prompt.formatted,
      ``,
      ...this.submissions.map((x, i) => `${i + 1}. ${x.submission}`),
      ``,
      `Vote for your favourite by sending a spoiler message to this channel`,
      `**or** by DMing the bot with the entry number`
    ])

  private message = (remainingSec: number, voters: Discord.User[]) =>
    this.baseContent
      .setFooter(`You have ${remainingSec} seconds. Still left to vote: ${this.users.filter(u => !voters.some(v => v == u)).map(u => u.username).join(', ')}`)

  get content() {
    return this.message(this.voteDurationSec, [])
  }

  onSent = (msg: Discord.Message, getState: () => AnyGameState) => {
    let remainingSec = this.voteDurationSec
    const interval = setInterval(() => {
      remainingSec -= 5
      const state = getState()
      if (remainingSec > 0 && state instanceof VotingState && state.context.roundId.eq(this.roundId)) {
        msg.edit(this.message(remainingSec, Array.from(state.votes.keys())))
      } else {
        clearInterval(interval)
        msg.edit(this.baseContent.setFooter(`Voting over!`))
      }
    }, 5000)
  }
}
