import * as Discord from 'discord.js'
import { AnyGameState } from '../state';
import { StartingState } from '../state/StartingState';
import { Message, mention } from './index'
import { GameContext } from '../context';
import { memberName } from './memberName';

export class GameStartedMessage implements Message {
  constructor(readonly notifyRole: Discord.Role | undefined, readonly startedBy: Discord.User, readonly context: GameContext) { }

  get content() {
    return this.message([this.startedBy])
  }

  message(interested: Discord.User[]) {
    const embed = new Discord.MessageEmbed()
      .setTitle(`:rotating_light: The game is afoot!`)
      .setDescription(`A new game was started by ${mention(this.startedBy)}; type \`!in\` to register interest. Once three people are interested, the game will begin (expires in 5 minutes)`)
      .setFooter(`In: ${interested.map(x => memberName(this.context.guild, x)).join(', ')}`)

    return this.notifyRole
      ? {
        content: `Calling all ${mention(this.notifyRole)}! (:point_left: type \`!notify\` if you want to be in this group)`,
        embed
      }
      : embed
  }

  onSent = (msg: Discord.Message, getState: () => AnyGameState) => {
    let remainingSec = StartingState.StartingStateDelayMs / 1000
    const interval = setInterval(() => {
      remainingSec -= 5
      const state = getState()
      if (remainingSec > 0 && state instanceof StartingState && state.context.gameId.eq(this.context.gameId)) {
        msg.edit(this.message(state.interested))
      } else {
        clearInterval(interval)
      }
    }, 5000)
  }
}