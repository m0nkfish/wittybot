import { mention, StaticMessage } from "../../messages";
import { MafiaGameContext } from '../context';
import * as Discord from 'discord.js';

export class VotingOverMessage implements StaticMessage {
  readonly type = 'static'
  
  constructor(
    readonly context: MafiaGameContext,
    readonly killed: Discord.User | undefined) {}

  get content() {
    return new Discord.MessageEmbed()
      .setTitle(this.killed ? `A decision has been made!` : `No decision could be made!`)
      .setDescription(
        this.killed ? [`${mention(this.killed)} has been executed according to the will of the people`] : []
      )
  }
}