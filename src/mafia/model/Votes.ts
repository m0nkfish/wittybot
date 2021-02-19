import { getOrSet } from '../../util';
import { Player } from './Player';

export class Votes {
  constructor(readonly votes: Map<Player, Player>) {}

  get = (voter: Player) => this.votes.get(voter)

  vote = (voter: Player, votee: Player) =>
    new Votes(new Map(this.votes).set(voter, votee))

  cancel = (voter: Player) => {
    const newMap = new Map(this.votes)
    newMap.delete(voter)
    return new Votes(newMap)
  }

  votesByPlayer = () => {
    const map = new Map<Player, Player[]>()
    for (const [voter, votee] of this.votes) {
      getOrSet(map, votee, () => []).push(voter)
    }
    return map
  }

  winner = () => {
    let winners: { votees: Player[], votes: number } | null = null
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