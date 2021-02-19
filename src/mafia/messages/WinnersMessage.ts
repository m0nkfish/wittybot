import * as Discord from 'discord.js';
import { Emojis, mention, StaticMessage } from "../../messages";
import { partition } from '../../util';
import { Player, Status } from '../model/Player';
import { Players } from '../model/Players';
import { Team } from "../model/Role";
import { dayNumber, nightNumber, roleText } from './text';

const status = (status: Status) => {
  switch (status.type) {
    case Status.Alive.type: return 'Alive!'
    case Status.Executed.type: return `Executed on Day ${dayNumber(status.round)}`
    case Status.Killed.type: return `Killed on Night ${nightNumber(status.round)} by ${mention(status.by.user)}`
  }
}

const display = (p: Player) => {
  const {emoji, name} = roleText(p.role)
  return `${emoji} ${mention(p.user)}, ${name}: ${status(p.status)}`
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
    switch (this.winningTeam.type) {
      case Team.Townsfolk.type: return `${Emojis.homes} The Townsfolk have peace at last!`
      case Team.Jester.type: return `${Emojis.rofl} He who laughs last, laughs longest... The Jester fooled you all!`
      case Team.Mafia.type: return `${Emojis.dagger} Business resumes... The Mafia have won!`
      case Team.Yakuza.type: return `${Emojis.dragon} There's a new gang in town... The Yakuza have won!`
      case Team.Werewolf.type: return `${Emojis.wolf} ${Emojis.fullMoon} Arooo! Against the odds, the Werewolf emerges victorious!`
    }
  }
}