import { MessageEmbed } from "discord.js";
import { Observable } from 'rxjs';
import { endWith, map, scan, takeWhile } from 'rxjs/operators';
import wu from 'wu';
import { Duration } from "../../duration";
import { CommandReacts, EmbedContent, Emoji, Emojis, mention, Message, MessageContent, setDescription, setFooter, StateStreamMessage } from "../../messages";
import { shuffle } from '../../random';
import { AnyGameState } from "../../state";
import { chain, pulse } from '../../util';
import { MafiaRoundContext } from '../context';
import { Player, Players, Votes } from '../model';
import { DayState } from '../state';

export class DayBeginsPublicMessage implements StateStreamMessage {
  readonly type = 'state-stream'

  readonly options: [Emoji, Player][]
  readonly reactable: Message['reactable']

  constructor(
    readonly context: MafiaRoundContext,
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
      .setDescription(this.description(new Votes(new Map)))
  }

  description = (votes: Votes) => {
    const votesByPlayer = votes.votesByPlayer()

    const display = (player: Player) => {
      const voters = votesByPlayer.get(player) ?? []
      let basic = mention(player.user)
      if (voters.length > 0) {
        basic += `: ${ voters.length } votes (${ voters.map(p => mention(p.user)).join(', ') })`
      }
      return basic + '\n'
    }

    return [
      `Vote to execute any player - if the vote results in a tie, nobody will be executed.`,
      ``,
      ...this.options.map(([emoji, user]) => emoji + ' ' + display(user))
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