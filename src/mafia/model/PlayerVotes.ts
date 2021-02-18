import * as Discord from 'discord.js';
import { getOrSet } from '../../util';

export class PlayerVotes {
  constructor(readonly votes: Map<Discord.User, Discord.User>) {}

  get = (voter: Discord.User) => this.votes.get(voter)

  vote = (voter: Discord.User, votee: Discord.User) =>
    new PlayerVotes(new Map(this.votes).set(voter, votee))

  votesByPlayer = () => {
    const map = new Map<Discord.User, Discord.User[]>()
    for (const [voter, votee] of this.votes) {
      getOrSet(map, votee, () => []).push(voter)
    }
    return map
  }

  winner = () => {
    let winners: { votees: Discord.User[], votes: number } | null = null
    for (const [votee, voters] of this.votesByPlayer()) {
      if (winners === null || winners.votes < voters.length) {
        winners = { votees: [votee], votes: voters.length }
      } else if (winners.votes === voters.length) {
        winners.votees = [...winners.votees, votee]
      }
    }
    if (winners && winners.votees.length === 1) {
      return winners.votees[0]
    }
  }
}