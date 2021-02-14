import * as Discord from 'discord.js'
import { interval } from 'rxjs'
import { map, takeWhile } from 'rxjs/operators'

import { AnyGameState } from '../../state';
import { StartingState } from '../state/StartingState';
import { Message, mention } from '../../messages'
import { WittyGameContext } from '../context';
import { StartingStateDelay } from '../state/newGame';
import { Duration } from '../../duration';
import { ScopedCommand, Command } from '../../commands/command';
import { In, WittyCommand } from '../commands';

export class GameStartedMessage implements Message {
  constructor(readonly notifyRole: Discord.Role | undefined, readonly context: WittyGameContext) { }

  private readonly inReact = ':thumbsup:'

  get startedBy() { return this.context.initiator }

  get content() {
    return this.message(StartingStateDelay, [this.startedBy])
  }

  message(remaining: Duration, interested: Discord.User[]) {
    const footer =
      remaining.isGreaterThan(Duration.minutes(1))
      ? `${remaining.minutes} minutes remaining`
      : `${remaining.seconds} seconds remaining`

    const title = `:person_running: It's a race to ${this.context.race}`

    const embed = new Discord.MessageEmbed()
      .setTitle(title)
      .setDescription([
        `A new game was started by ${mention(this.startedBy)}; type \`!in\` or react with :thumbsup: to register interest. The game will begin after ${Math.max(this.context.minPlayers, 5)} people are interested, or after three minutes (whichever comes first)`,
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
    msg.react(this.inReact)

    interval(5000)
      .pipe(
        map(_ => getState()),
        takeWhile(s => s instanceof StartingState && s.context.sameGame(this.context) && s.remaining().isGreaterThan(0)),
        map(s => s as StartingState)
      )
      .subscribe(
        s => msg.edit(this.message(s.remaining(), s.interested)),
        () => msg.edit({ embed: msg.embeds[0].setFooter('') }),
        () => msg.edit({ embed: msg.embeds[0].setFooter('') }))
  }

  onReact = (reaction: Discord.MessageReaction, user: Discord.User, member?: Discord.GuildMember): Command | undefined => {
    if (reaction.emoji.name === this.inReact && member) {
      return ScopedCommand(member.guild, In(member))
    }
  }
}