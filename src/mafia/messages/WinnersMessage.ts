import * as Discord from 'discord.js';
import { mention, StaticMessage } from "../../messages";
import { partition } from '../../util';
import { Player } from '../model/Player';
import { Players } from '../model/Players';
import { Team } from "../model/Role";
import { Emojis, roleText } from './text';

export class WinnersMessage implements StaticMessage {
  readonly type = 'static'
  
  constructor(readonly winningTeam: Team, readonly players: Players) { }

  get content() {
    const display = (p: Player) => {
      return `${roleText.get(p.role)!.emoji} ${mention(p.user)}: ${p.role.type} (${p.isAlive ? 'alive' : 'dead'})`
    }

    const [losers, winners] = partition(this.players.players, p => p.isOnTeam(this.winningTeam))

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