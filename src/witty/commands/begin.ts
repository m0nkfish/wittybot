import * as Discord from 'discord.js'
import { Case } from '../../case'
import { IdleState } from '../../state/IdleState';

import { tryParseInt, clamp } from '../../util';
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import { CommandFactory } from '../../commands';
import { Duration } from '../../duration';

export const Begin = Case('witty-begin', (user: Discord.User, channel: Discord.TextChannel, timeout: Duration, minPlayers: number, race: number) => ({ channel, user, timeout, minPlayers, race }))

export const BeginFactory = () => new CommandFactory((state, message) => {
  if (state instanceof IdleState && message.channel instanceof Discord.TextChannel && /^!witty\b/.test(message.content)) {
    const timeout = pipe(
      /\btimeout (\d+)\b/.exec(message.content),
      O.fromNullable,
      O.mapNullable(x => tryParseInt(x[1])),
      O.map(x => clamp(x, 10, 120)),
      O.map(Duration.seconds),
      O.getOrElse(() => state.context.config.defaultSubmitDuration)
    )

    const minPlayers = pipe(
      /\bplayers (\d+)\b/.exec(message.content),
      O.fromNullable,
      O.mapNullable(x => tryParseInt(x[1])),
      O.map(x => clamp(x, 3, 6)),
      O.getOrElse(() => 3)
    )

    const race = pipe(
      /\brace (\d+)\b/.exec(message.content),
      O.fromNullable,
      O.mapNullable(x => tryParseInt(x[1])),
      O.map(x => clamp(x, 5, 30)),
      O.getOrElse(() => 20)
    )

    return Begin(message.author, message.channel, timeout, minPlayers, race)
  }
})
