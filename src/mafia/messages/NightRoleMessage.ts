import { mention, Message } from "../../messages";
import * as Discord from 'discord.js';
import { Role } from "../Role";
import { PlayerStatuses } from "../PlayerStatuses";
import { MafiaRoleCommandFactory } from "../commands";
import { actionText, nightNumber, roleText, CommandReacts } from './text';
import { shuffle } from "../../random";
import wu from 'wu';
import { Duration } from "../../duration";
import { AnyGameState } from "../../state";
import { Observable, interval, combineLatest } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { NightState } from '../state/NightState';
import { NightDuration } from "../constants";
import { MafiaGameContext } from '../context';

export class NightRoleMessage implements Message {
  readonly options: [string, Discord.User][]
  readonly reactable: Message['reactable']

  constructor(
    readonly context: MafiaGameContext,
    readonly role: Role,
    readonly command: MafiaRoleCommandFactory,
    readonly statuses: PlayerStatuses,
    readonly round: number) {
      this.options = wu.zip(CommandReacts, shuffle(statuses.alivePlayers())).toArray()
      this.reactable = {
        reacts: this.options.map(r => r[0])
      }
  }

  findTarget(emoji: string): Discord.User | undefined {
    return this.options.find(([e]) => emoji === e)?.[1]
  }

  get content() {
    return new Discord.MessageEmbed()
      .setTitle(`${roleText.get(this.role)!.emoji} Night ${nightNumber(this.round)} - Choose someone to ${actionText(this.command)}`)
      .setDescription(
        this.options.map(([emoji, user]) => `${emoji} - ${mention(user)}`)
      )
      .setFooter(this.footer(NightDuration))
  }

  footer = (remaining: Duration) => `${remaining.seconds} seconds remaining`

  onSent = (msg: Discord.Message, stateStream: Observable<AnyGameState>) => {
    combineLatest([stateStream, interval(5000)])
      .pipe(
        map(([s]) => s),
        takeWhile(s => s instanceof NightState && s.remaining().isGreaterThan(0)),
        map(s => s as NightState)
      )
      .subscribe(
        s => msg.edit({ embed: msg.embeds[0].setFooter(this.footer(s.remaining())) }),
        () => msg.edit({ embed: msg.embeds[0].setFooter('') }),
        () => msg.edit({ embed: msg.embeds[0].setFooter('') }))
  }
}