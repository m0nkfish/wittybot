import { mention, Message, StaticMessage } from "../../messages";
import { Team } from "../model/Role";
import * as Discord from 'discord.js';
import { Emojis, roleText } from './text'
import { PlayerStatuses } from '../model/PlayerStatuses';

export class WinnersMessage implements StaticMessage {
  readonly type = 'static'
  
  constructor(readonly team: Team, readonly players: PlayerStatuses) { }

  get content() {
    return new Discord.MessageEmbed()
      .setTitle(`${Emojis.tada} The ${this.team} win the game!`)
      .setDescription([
        `End game state:`,
        ...this.players.players.map(p => `${roleText.get(p.role)!.emoji} ${mention(p.player)}: ${p.role.type} (${p.isAlive ? 'alive' : 'dead'})`)
      ])
  }
}