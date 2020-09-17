import * as Discord from 'discord.js'
import { AnyGameState } from '../state';
import { StartingState } from '../state/StartingState';
import { Message, mention } from './index'
import { GameContext } from '../context';
import { StartingStateDelayMs } from '../state/newGame';

export class GameStartedMessage implements Message {
  constructor(readonly notifyRole: Discord.Role | undefined, readonly startedBy: Discord.User, readonly context: GameContext) { }

  get content() {
    return this.message(StartingStateDelayMs / 1000, [this.startedBy])
  }

  message(remainingSec: number, interested: Discord.User[]) {
    const footer =
      remainingSec >= 60 ? `${Math.floor(remainingSec / 60)} minutes remaining`
      : `${remainingSec} seconds remaining`

    const embed = new Discord.MessageEmbed()
      .setTitle(`:rotating_light: The game is afoot!`)
      .setDescription([
        `A new game was started by ${mention(this.startedBy)}; type \`!in\` to register interest. The game will begin after five people are interested, or after three minutes (whichever comes first)`,
        ``,
        `In:`,
        ...interested.map(x => `• ${mention(x)}`)
      ])
      .setFooter(footer)

    return this.notifyRole
      ? {
        content: `Calling all ${mention(this.notifyRole)}! (:point_left: type \`!notify\` if you want to be in this group)`,
        embed
      }
      : embed
  }

  onSent = (msg: Discord.Message, getState: () => AnyGameState) => {
    let remainingSec = StartingStateDelayMs / 1000
    const interval = setInterval(() => {
      remainingSec -= 5
      const state = getState()
      if (remainingSec > 0 && state instanceof StartingState && state.context.gameId.eq(this.context.gameId)) {
        msg.edit(this.message(remainingSec, state.interested))
      } else {
        msg.edit({ embed: msg.embeds[0].setFooter('') })
        clearInterval(interval)
      }
    }, 5000)
  }
}