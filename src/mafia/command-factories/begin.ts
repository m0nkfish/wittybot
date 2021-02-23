import * as Discord from 'discord.js';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import { CommandFactory } from '../../commands';
import { MessageReceived } from '../../discord-events';
import { Duration } from '../../duration';
import { IdleState } from '../../state/IdleState';
import { clamp, tryParseInt } from '../../util';
import { Begin } from '../commands';
import { MafiaSettings } from '../context';

export const BeginFactory = () => CommandFactory.build.state(IdleState).event(MessageReceived).process(((_, { message }) => {
  if (message.channel instanceof Discord.TextChannel && /^!mafia\b/.test(message.content)) {
    const member = message.guild?.member(message.author)
    if (!member) {
      return
    }

    const minPlayers = pipe(
      /\bplayers (\d+)\b/.exec(message.content),
      O.fromNullable,
      O.mapNullable(x => tryParseInt(x[1])),
      O.map(x => clamp(x, 2, 10)),
      O.getOrElse(() => 5)
    )

    const settings: MafiaSettings = {
      nightDuration: Duration.seconds(60),
      dayDuration: Duration.seconds(60),
      reveals: (/\breveals (on|off)\b/.exec(message.content)?.[1] ?? "on") === "on",
      minPlayers
    }

    return Begin(member, message.channel, settings)
  }
}))
