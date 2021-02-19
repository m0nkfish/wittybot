import * as Discord from 'discord.js';
import { Action, CompositeAction, DelayedAction, FromStateAction, NewState, OptionalAction, PromiseAction, Send } from '../../actions';
import { GuildContext } from '../../context/GuildContext';
import { Duration } from '../../duration';
import { Id } from '../../id';
import { BasicMessage, RoleMentionNotifyMessage } from '../../messages';
import { Timer } from '../../util';
import { WittyGameContext } from '../context';
import { GameStartedMessage } from '../messages';
import { getNotifyRole } from '../notify';
import { IdleState } from './../../state';
import { StartingState } from './StartingState';

export function newGame(guildContext: GuildContext, channel: Discord.TextChannel, initiator: Discord.User, timeout: Duration, minPlayers: number, race: number): Action {
  const context = new WittyGameContext(guildContext, channel, Id.create(), initiator, [], timeout, minPlayers, race)

  const gameStartedMessage = getNotifyRole(context.guild)
    .then(role => CompositeAction(
      OptionalAction(role && Send(context.channel, new RoleMentionNotifyMessage(role))),
      Send(context.channel, new GameStartedMessage(context))))

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
    DelayedAction(StartingStateDelay, onTimeout),
    NewState(new StartingState(context, [context.initiator], Timer.begin())),
    PromiseAction(gameStartedMessage),
  )
}

export const StartingStateDelay = Duration.minutes(3)