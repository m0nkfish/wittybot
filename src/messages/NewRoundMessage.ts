import * as Discord from 'discord.js'
import { Prompt } from '../prompts';
import { AnyGameState, SubmissionState } from '../state';
import { Id } from '../id';
import { Message } from './index'

export class NewRoundMessage implements Message {
  constructor(
    readonly roundId: Id,
    readonly prompt: Prompt,
    readonly botUser: Discord.User,
    readonly submitDurationSec: number
  ) { }

  private readonly baseContent = new Discord.MessageEmbed()
    .setTitle(this.prompt.formatted)
    .setDescription([
      `Submit by sending a spoiler message (\`||whatever||\`, or \`/spoiler whatever\` on desktop) to this channel`,
      `**or** by DMing the bot (:point_up: on desktop just click the sender name)`
    ])

  private message = (remainingSec: number) =>
    this.baseContent
      .setFooter(`You have ${remainingSec} seconds to come up with an answer`)

  get content() {
    return this.message(this.submitDurationSec)
  }

  onSent = (msg: Discord.Message, getState: () => AnyGameState) => {
    let remainingSec = this.submitDurationSec
    const interval = setInterval(() => {
      remainingSec -= 5
      const state = getState()
      if (remainingSec > 0 && state instanceof SubmissionState && state.context.roundId.eq(this.roundId)) {
        msg.edit(this.message(remainingSec))
      } else {
        clearInterval(interval)
        msg.edit(this.baseContent.setFooter(`Time's up!`))
      }
    }, 5000)
  }
}