import { MessageEmbed } from "discord.js";
import { mention, Message } from "../../messages";
import { dayNumber, Emojis, CommandReacts } from './text';
import { MafiaGameContext } from '../context';
import { PlayerStatuses } from '../PlayerStatuses';
import * as Discord from 'discord.js';
import { Observable, interval, combineLatest } from 'rxjs';
import { AnyGameState } from "../../state";
import { takeWhile, map } from 'rxjs/operators';
import { DayState } from '../state/DayState';
import { Duration } from "../../duration";
import wu from 'wu';
import { shuffle } from '../../random';
import { PlayerVotes } from "../PlayerVotes";

export class DayBeginsPublicMessage implements Message {
  readonly options: [string, Discord.User][]
  readonly reactable: Message['reactable']

  constructor(
    readonly context: MafiaGameContext,
    readonly round: number,
    readonly killed: Discord.User[],
    readonly statuses: PlayerStatuses) {
      this.options = wu.zip(CommandReacts, shuffle(statuses.alivePlayers())).toArray()
      this.reactable = {
        reacts: this.options.map(r => r[0])
      }
  }

  findTarget(emoji: string): Discord.User | undefined {
    return this.options.find(([e]) => emoji === e)?.[1]
  }

  get content() {
    return new MessageEmbed()
      .setTitle(`${Emojis.day} Day ${dayNumber(this.round)} Begins!`)
      .setDescription(this.description(new PlayerVotes(new Map)))
  }

  description = (votes: PlayerVotes) => {
    const deaths = this.killed.length > 0 ? `Deaths last night: ${this.killed.map(mention).join(', ')}` : `Nobody died last night.`
    const votesByPlayer = votes.votesByPlayer()
    return [
      deaths,
      ``,
      `Vote to kill any player - if the vote results in a tie, nobody will die.`,
      ...this.options.map(([emoji, user]) => `${emoji} - ${mention(user)}`)
    ]
  }

  footer = (remaining: Duration) => `${remaining.seconds} seconds remaining`

  onSent = (msg: Discord.Message, stateStream: Observable<AnyGameState>) => {
    combineLatest([stateStream, interval(5000)])
      .pipe(
        map(([s]) => s),
        takeWhile(s => s instanceof DayState && s.remaining().isGreaterThan(0)),
        map(s => s as DayState)
      )
      .subscribe(
        s => msg.edit({ embed: msg.embeds[0]
          .setDescription(this.description(s.playerVotes))
          .setFooter(this.footer(s.remaining())) }),
        () => msg.edit({ embed: msg.embeds[0].setFooter('') }),
        () => msg.edit({ embed: msg.embeds[0].setFooter('') }))
  }
}