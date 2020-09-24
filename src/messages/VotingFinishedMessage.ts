import * as Discord from 'discord.js'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'

import { Prompt } from '../prompts';
import { pairs, arrayEq } from '../util';
import { Message, mention } from './index'
import { GameContext } from '../context';
import { memberName } from './memberName';

export class VotingFinishedMessage implements Message {
  constructor(
    readonly context: GameContext,
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

  memberName = (user: Discord.User) => memberName(this.context.guild, user)

  leaders = () => pipe(this.context.race, O.map(() => this.context.scores.mostPoints()))

  get content() {
    let title = `The votes are in!`
    const sweep = this.sweep()
    const split = this.split()
    const pals = this.pals()
    if (sweep) {
      title = title + ` :trophy: ${this.memberName(sweep)} sweeps the board!`
    } else if (split) {
      title = title + ` :bowling: It's a ${this.withVotes.length}-way split!`
    } else if (pals) {
      title = title + ` :revolving_hearts: ${this.memberName(pals[0])} and ${this.memberName(pals[1])} sitting in a tree, V-O-T-I-N-G (for each other)`
    }
  
    const footer = pipe(
      this.leaders(),
      O.map(l => `In the lead: ${l.users.map(this.memberName).join(' & ')} with ${l.points} points`),
      O.getOrElse(() => '')
    )

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
              name = name + `: ${x.votes.map(this.memberName).join(', ')}`
            }
          } else {
            name = name + `, who didn't vote`
          }
          return `• ${x.submission} (${name})`
        })
      ])
      .setFooter(footer)
  }
}