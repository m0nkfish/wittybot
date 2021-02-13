import { Action, NewState, CompositeAction, Send, PromiseAction, OptionalAction, DelayedAction, FromStateAction } from '../../actions';
import { WittyGameContext } from '../context';
import { getNotifyRole } from '../notify';
import { GameStartedMessage } from '../messages';
import { BasicMessage } from '../../messages';
import { IdleState } from './../../state';
import { StartingState } from './StartingState';
import { GuildContext } from '../../context/GuildContext';
import * as Discord from 'discord.js';
import { Id } from '../../id';
import { Timer } from '../../util';
import { Duration } from '../../duration';

export function newGame(guildContext: GuildContext, channel: Discord.TextChannel, initiator: Discord.User, timeout: Duration, minPlayers: number, race: number): Action {
  const context = new WittyGameContext(guildContext, channel, Id.create(), initiator, [], timeout, minPlayers, race)
  const gameStartedMessage = getNotifyRole(context.guild)
    .then(role => Send(context.channel, new GameStartedMessage(role, context)))

  const onTimeout =
    FromStateAction(context.channel.guild, state =>
      OptionalAction(state instanceof StartingState && state.context.sameGame(context) &&
        (state.enoughInterest()
        ? state.begin()
        : CompositeAction(
            Send(context.channel, new BasicMessage(`Not enough players to begin the game`)),
            NewState(new IdleState(context.guildCtx))
          )
        )
      )
    )

  return CompositeAction(
    PromiseAction(gameStartedMessage),
    DelayedAction(StartingStateDelay, onTimeout),
    NewState(new StartingState(context, [context.initiator], Timer.begin())),
  )
}

export const StartingStateDelay = Duration.minutes(3)