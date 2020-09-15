import * as Discord from 'discord.js'
import { Prompt } from '../prompts';
import { pairs, arrayEq } from '../util';
import { Message, mention } from './index'

export class VotingFinishedMessage implements Message {
  constructor(
    readonly prompt: Prompt,
    readonly withVotes: Array<{ user: Discord.User, votes: Discord.User[], voted: boolean, submission: string }>) { }

  sweep(): Discord.User | undefined {
    const sweep = this.withVotes.find(x => x.voted && x.votes.length === this.withVotes.length - 1)
    if (sweep) {
      return sweep.user
    }
  }

  split(): number | undefined {
    if (this.withVotes.every(v => v.voted && v.votes.length === 1)) {
      return this.withVotes.length
    }
  }

  pals(): [Discord.User, Discord.User] | undefined {
    for (const [a, b] of pairs(this.withVotes)) {
      if (arrayEq(a.votes, [b.user]) && arrayEq([a.user], b.votes)) {
        return [a.user, b.user]
      }
    }
  }

  get content() {
    let title = `The votes are in!`
    const sweep = this.sweep()
    const split = this.split()
    const pals = this.pals()
    if (sweep) {
      title = title + ` :trophy: ${sweep.username} sweeps the board!`
    } else if (split) {
      title = title + ` :bowling: It's a ${this.withVotes.length}-way split!`
    } else if (pals) {
      title = title + ` :revolving_hearts: ${pals[0].username} and ${pals[1].username} sitting in a tree, V-O-T-I-N-G (for each other)`
    }

    return new Discord.MessageEmbed()
      .setTitle(title)
      .setDescription([
        this.prompt.formatted,
        ``,
        ...this.withVotes.map(x => {
          let name = mention(x.user)
          if (x.voted) {
            name = name + `, with ${x.votes.length} votes`
            if (x.votes.length > 0) {
              name = name + `: ${x.votes.map(mention).join(', ')}`
            }
          } else {
            name = name + `, who didn't vote`
          }
          return `• ${x.submission} (${name})`
        })
      ])
  }
}