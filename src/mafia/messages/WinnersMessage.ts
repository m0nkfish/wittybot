import * as Discord from 'discord.js';
import { mention, StaticMessage } from "../../messages";
import { Players } from '../model/Players';
import { Team } from "../model/Role";
import { Emojis, roleText } from './text';

export class WinnersMessage implements StaticMessage {
  readonly type = 'static'
  
  constructor(readonly team: Team, readonly players: Players) { }

  get content() {
    return new Discord.MessageEmbed()
      .setTitle(`${Emojis.tada} The ${this.team} win the game!`)
      .setDescription([
        `End game state:`,
        ...this.players.players.map(p => `${roleText.get(p.role)!.emoji} ${mention(p.user)}: ${p.role.type} (${p.isAlive ? 'alive' : 'dead'})`)
      ])
  }
}