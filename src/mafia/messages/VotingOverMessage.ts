import * as Discord from 'discord.js';
import { mention, StaticMessage } from "../../messages";
import { MafiaGameContext } from '../context';
import { Player } from '../model/Player';
import { roleText } from './text';

export class VotingOverMessage implements StaticMessage {
  readonly type = 'static'
  
  constructor(
    readonly context: MafiaGameContext,
    readonly killed: Player | undefined) {}

  get content() {

    const display = (player: Player) => {
      let basic = mention(player.user)
      if (this.context.settings.reveals) {
        basic += ` (${roleText.get(player.role)!.name})`
      }
      return basic
    }
    
    return new Discord.MessageEmbed()
      .setTitle(this.killed ? `A decision has been made!` : `No decision could be made!`)
      .setDescription(
        this.killed ? [`${display(this.killed)} has been executed according to the will of the people`] : []
      )
  }
}