import * as Discord from 'discord.js';
import { Observable } from 'rxjs';
import { endWith, map, scan, takeWhile } from 'rxjs/operators';
import wu from 'wu';
import { Duration } from "../../duration";
import { CommandReacts, EmbedContent, mention, MessageContent, setDescription, setFooter, StateStreamMessage } from "../../messages";
import { shuffle } from "../../random";
import { AnyGameState } from "../../state";
import { chain, invoke, isType, pulse } from '../../util';
import { Idle } from "../commands";
import { NightCommand, NightCommandFactory } from '../commands/all';
import { Player } from '../model';
import { NightState } from '../state';
import { commandText, getCommandText, roleText } from './text';

export class NightRoleMessage implements StateStreamMessage {
  readonly type = 'state-stream'

  constructor(
    readonly initialState: NightState,
    readonly player: Player,
    readonly command: NightCommandFactory) {
  }

  readonly context = this.initialState.context
  readonly options = invoke(() => {
    const targets = shuffle(this.initialState.targets(this.player)).map(target => this.command(this.player, target))
    return wu.zip(CommandReacts, [Idle(this.player), ...targets]).toArray()
  })
  readonly reactable = {
    reacts: this.options.map(r => r[0])
  }

  findTarget(emoji: string): Player | undefined {
    return this.options.find(([e]) => emoji === e)?.[1]?.target
  }

  getCommand(emoji: string): NightCommand | undefined {
    return this.options.find(([e]) => emoji === e)?.[1]
  }

  get content(): EmbedContent {
    return new Discord.MessageEmbed()
      .setTitle(`${roleText(this.player.role).emoji} Night ${this.context.nightNumber} - Choose someone to ${commandText(this.command).verb}`)
      .setDescription(this.description(this.initialState))
  }

  description = (state: NightState) => {
    const intention: NightCommand | undefined = state.intentions.get(this.player)
      ?? state.findPartnerIntentions(this.player)[0]

    const display = (command: NightCommand): string => {
      let line = getCommandText(command)
      if (intention && intention.type === command.type && intention.target === command.target) {
        line += ' [chosen'
        if (intention.user !== this.player) {
          line += ' by ' + mention(intention.user.user)
        }
        line += ']'
      }
      return line
    }

    return [
      `Choose your action by reacting to this message`,
      ...this.options.map(([emoji, command]) => emoji + ' ' + display(command))
    ]
  }

  footer = (remaining: Duration) => `${remaining.seconds} seconds remaining`

  content$ = (stateStream: Observable<AnyGameState>): Observable<MessageContent> =>
    pulse(stateStream, Duration.seconds(5))
      .pipe(
        takeWhile(isType(NightState)),
        map(s => chain(
          setDescription(this.description(s)),
          setFooter(this.footer(s.remaining()))
        )),
        endWith(setFooter(`Day has begun!`)),
        scan((content, update) => update(content), this.content)
      )
}