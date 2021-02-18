import * as Discord from 'discord.js';
import { MessageEmbed } from "discord.js";
import { Observable } from 'rxjs';
import { endWith, map, scan, takeWhile } from 'rxjs/operators';
import wu from 'wu';
import { Duration } from "../../duration";
import { EmbedContent, mention, Message, MessageContent, setDescription, setFooter, StateStreamMessage } from "../../messages";
import { shuffle } from '../../random';
import { AnyGameState } from "../../state";
import { chain, pulse } from '../../util';
import { MafiaRoundContext } from '../context';
import { Player } from '../model/Player';
import { Players } from '../model/Players';
import { PlayerVotes } from "../model/PlayerVotes";
import { DayState } from '../state/DayState';
import { CommandReacts, Emojis } from './text';

export class DayBeginsPublicMessage implements StateStreamMessage {
  readonly type = 'state-stream'

  readonly options: [string, Player][]
  readonly reactable: Message['reactable']

  constructor(
    readonly context: MafiaRoundContext,
    readonly killed: Discord.User[],
    readonly statuses: Players) {
      this.options = wu.zip(CommandReacts, shuffle(statuses.alive())).toArray()
      this.reactable = {
        reacts: this.options.map(r => r[0])
      }
  }

  findTarget(emoji: string): Player | undefined {
    return this.options.find(([e]) => emoji === e)?.[1]
  }

  get content(): EmbedContent {
    return new MessageEmbed()
      .setTitle(`${Emojis.day} Day ${this.context.dayNumber} Begins!`)
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
        return `${emoji} - ${mention(user.user)} (${voters.length} votes: ${voters.map(p => mention(p.user)).join(', ')})`
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
          setDescription(this.description(s.votes))
        )),
        endWith(setFooter('')),
        scan((content, update) => update(content), this.content)
      )
}