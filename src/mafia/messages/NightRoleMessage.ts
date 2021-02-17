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
import { Observable } from 'rxjs';
import { endWith, map, scan, takeWhile } from 'rxjs/operators';
import { NightState } from '../state/NightState';
import { NightDuration } from "../constants";
import { MafiaGameContext } from '../context';
import { StateStreamMessage, setFooter, MessageContent, EmbedContent } from '../../messages';
import { pulse } from '../../util';

export class NightRoleMessage implements StateStreamMessage {
  readonly type = 'state-stream'
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

  get content(): EmbedContent {
    return new Discord.MessageEmbed()
      .setTitle(`${roleText.get(this.role)!.emoji} Night ${nightNumber(this.round)} - Choose someone to ${actionText(this.command)}`)
      .setDescription(
        this.options.map(([emoji, user]) => `${emoji} - ${mention(user)}`)
      )
      .setFooter(this.footer(NightDuration))
  }

  footer = (remaining: Duration) => `${remaining.seconds} seconds remaining`

  content$ = (stateStream: Observable<AnyGameState>): Observable<MessageContent> =>
    pulse(stateStream, Duration.seconds(5))
      .pipe(
        takeWhile(s => s instanceof NightState && s.remaining().isGreaterThan(0)),
        map(s => s as NightState),
        map(s => setFooter(this.footer(s.remaining()))),
        endWith(setFooter(`Time's up!`)),
        scan((content, update) => update(content), this.content)
      )
}