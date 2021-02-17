import { MessageEmbed } from "discord.js";
import wu from 'wu';
import * as Discord from 'discord.js';
import { Observable, concat, of } from 'rxjs';
import { takeWhile, map, scan } from 'rxjs/operators';
import { StateStreamMessage, mention, Message, MessageContent, setDescription, setFooter, EmbedContent } from "../../messages";
import { dayNumber, Emojis, CommandReacts } from './text';
import { MafiaGameContext } from '../context';
import { PlayerStatuses } from '../PlayerStatuses';
import { AnyGameState } from "../../state";
import { DayState } from '../state/DayState';
import { Duration } from "../../duration";
import { shuffle } from '../../random';
import { PlayerVotes } from "../PlayerVotes";
import { chain, pulse } from '../../util';

export class DayBeginsPublicMessage implements StateStreamMessage {
  readonly type = 'state-stream'

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

  get content(): EmbedContent {
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
      ...this.options.map(([emoji, user]) => {
        const voters = votesByPlayer.get(user) ?? []
        return `${emoji} - ${mention(user)} (${voters.length} votes: ${voters.map(mention).join(', ')})`
      })
    ]
  }

  footer = (remaining: Duration) => `${remaining.seconds} seconds remaining`

  content$ = (stateStream: Observable<AnyGameState>): Observable<MessageContent> =>
    pulse(stateStream, Duration.seconds(5))
      .pipe(
        takeWhile(s => s instanceof DayState && s.remaining().isGreaterThan(0)),
        map(s => s as DayState),
        map(s => chain(
          setFooter(this.footer(s.remaining())),
          setDescription(this.description(s.playerVotes))
        )),
        o => concat(o, of(setFooter(''))),
        scan((content, update) => update(content), this.content)
      )
}