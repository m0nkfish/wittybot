import * as Discord from 'discord.js';
import { mention, StaticMessage } from "../../messages";
import { partition } from '../../util';
import { Player, Status } from '../model/Player';
import { Players } from '../model/Players';
import { Team } from "../model/Role";
import { dayNumber, Emojis, nightNumber, roleText } from './text';

const status = (status: Status) => {
  switch (status.type) {
    case Status.Alive.type: return 'Alive!'
    case Status.Executed.type: return `Executed on Day ${dayNumber(status.round)}`
    case Status.Killed.type: return `Killed on Night ${nightNumber(status.round)} by ${mention(status.by.user)}`
  }
}

const display = (p: Player) => {
  const role = roleText.get(p.role)!
  return `${role.emoji} ${mention(p.user)}, ${role.name}: ${status(p.status)}`
}

const compareStatus = (s1: Status, s2: Status): number => {
  if (s1.type === Status.Alive.type) {
    return s2.type === Status.Alive.type ? 0 : -1
  }
  if (s2.type === Status.Alive.type) {
    return 1
  }
  return s2.round - s1.round
}

export class WinnersMessage implements StaticMessage {
  readonly type = 'static'
  
  constructor(readonly winningTeam: Team, readonly players: Players) { }

  get content() {
    const byStatus = [...this.players.players].sort((p1, p2) => compareStatus(p1.status, p2.status))
    const [losers, winners] = partition(byStatus, p => p.isOnTeam(this.winningTeam))

    return new Discord.MessageEmbed()
      .setTitle(this.title)
      .setDescription([
        `Congratulations to:`,
        ...winners.map(display),
        ``,
        `Better luck next time to:`,
        ...losers.map(display)
      ])
  }

  get title(): string {
    switch (this.winningTeam) {
      case Team.Townsfolk: return `${Emojis.homes} The Townsfolk have peace at last!`
      case Team.Jester: return `${Emojis.rofl} The Jester fooled you all!`
      case Team.Mafia: return `${Emojis.dagger} Business resumes... The Mafia have won!`
      case Team.Yakuza: return `${Emojis.dragon} There's a new gang in town... The Yakuza have won!`
      case Team.Werewolf: return `${Emojis.wolf} ${Emojis.fullMoon} Arooo! Against the odds, the Werewolf emerges victorious!`
      default: return `Game over!`
    }
  }
}