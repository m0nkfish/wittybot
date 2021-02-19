import * as Discord from 'discord.js';
import { Observable } from 'rxjs';
import { endWith, map, scan, takeWhile } from 'rxjs/operators';
import wu from 'wu';
import { Duration } from "../../duration";
import { EmbedContent, mention, MessageContent, setDescription, setFooter, StateStreamMessage } from "../../messages";
import { shuffle } from "../../random";
import { AnyGameState } from "../../state";
import { chain, pulse } from '../../util';
import { MafiaRoleCommandFactory } from "../commands";
import { MafiaCommand } from '../commands/all';
import { PlayerIntention } from '../model/Intentions';
import { Player } from '../model/Player';
import { NightState } from '../state/NightState';
import { actionText, CommandReacts, roleText } from './text';

export class NightRoleMessage implements StateStreamMessage {
  readonly type = 'state-stream'

  constructor(
    readonly initialState: NightState,
    readonly player: Player,
    readonly command: MafiaRoleCommandFactory) {
  }

  readonly context = this.initialState.context
  readonly options = wu.zip(CommandReacts, shuffle(this.initialState.targets(this.player))).toArray()
  readonly reactable = {
    reacts: this.options.map(r => r[0])
  }

  findTarget(emoji: string): Player | undefined {
    return this.options.find(([e]) => emoji === e)?.[1]
  }

  createCommand(user: Player, emoji: string): MafiaCommand | undefined {
    const target = this.findTarget(emoji)
    return target && this.command(user, target)
  }

  get content(): EmbedContent {
    return new Discord.MessageEmbed()
      .setTitle(`${roleText.get(this.player.role)!.emoji} Night ${this.context.nightNumber} - Choose someone to ${actionText(this.command)}`)
      .setDescription(this.description(this.initialState))
  }

  description = (state: NightState) => {
    const intention: PlayerIntention | undefined = state.intentions.get(this.player)
      ?? state.findPartnerIntentions(this.player)[0]

    const display = (emoji: string, target: Player): string => {
      let line = `${emoji} ${mention(target.user)}`
      if (intention && intention.target === target) {
        line += ' [chosen'
        if (intention.player !== this.player) {
          line += ' by ' + mention(intention.player.user)
        }
        line += ']'
      }
      return line
    }

    return this.options
      .map(([emoji, target]) => display(emoji, target))
  }

  footer = (remaining: Duration) => `${remaining.seconds} seconds remaining`

  content$ = (stateStream: Observable<AnyGameState>): Observable<MessageContent> =>
    pulse(stateStream, Duration.seconds(5))
      .pipe(
        takeWhile(s => s instanceof NightState),
        map(s => s as NightState),
        map(s => chain(
          setDescription(this.description(s)),
          setFooter(this.footer(s.remaining()))
        )),
        endWith(setFooter(`Day has begun!`)),
        scan((content, update) => update(content), this.content)
      )
}