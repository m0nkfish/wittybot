import * as Discord from 'discord.js';
import { Emojis, mention, StaticMessage } from "../../messages";
import { MafiaRoundContext } from '../context';
import { Player } from '../model/Player';
import { roleText } from './text';

export class DayEndsPublicMessage implements StaticMessage {
  readonly type = 'static'
  
  constructor(
    readonly context: MafiaRoundContext,
    readonly killed: Player | undefined) {}

  get content() {

    const display = (player: Player) => {
      let basic = mention(player.user)
      if (this.context.settings.reveals) {
        basic += ` (${roleText(player.role).name})`
      }
      return basic
    }
    
    return new Discord.MessageEmbed()
      .setTitle(`${Emojis.sunset} Day ${this.context.dayNumber} Ends...`)
      .setDescription([
        this.killed ? `A decision has been made!` : `No decision could be made!`,
        ...(this.killed ? [``, `${display(this.killed)} has been executed according to the will of the people`] : [])
      ])
  }
}