import * as Discord from 'discord.js'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'

import { AnyGameState } from '../state';
import { StartingState } from '../state/StartingState';
import { Message, mention } from '../../messages'
import { GameContext } from '../context';
import { StartingStateDelayMs } from '../state/newGame';

export class GameStartedMessage implements Message {
  constructor(readonly notifyRole: Discord.Role | undefined, readonly context: GameContext) { }

  get startedBy() { return this.context.initiator }

  get content() {
    return this.message(StartingStateDelayMs / 1000, [this.startedBy])
  }

  message(remainingSec: number, interested: Discord.User[]) {
    const footer =
      remainingSec >= 60 ? `${Math.floor(remainingSec / 60)} minutes remaining`
      : `${remainingSec} seconds remaining`

    const title = pipe(
      this.context.race,
      O.map(x => `:person_running: It's a race to ${x}`),
      O.getOrElse(() => `:rotating_light: The game is afoot!`)
    )

    const embed = new Discord.MessageEmbed()
      .setTitle(title)
      .setDescription([
        `A new game was started by ${mention(this.startedBy)}; type \`!in\` to register interest. The game will begin after ${Math.max(this.context.minPlayers, 5)} people are interested, or after three minutes (whichever comes first)`,
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
      if (remainingSec > 0 && state instanceof StartingState && state.context.sameGame(this.context)) {
        msg.edit(this.message(remainingSec, state.interested))
      } else {
        msg.edit({ embed: msg.embeds[0].setFooter('') })
        clearInterval(interval)
      }
    }, 5000)
  }
}