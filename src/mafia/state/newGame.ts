import { Action, NewState, CompositeAction, Send, OptionalAction, DelayedAction, FromStateAction } from '../../actions';
import { MafiaGameContext } from '../context';
import { GameStartedMessage } from '../messages';
import { BasicMessage } from '../../messages';
import { IdleState } from './../../state';
import { StartingState } from './StartingState';
import { GuildContext } from '../../context/GuildContext';
import * as Discord from 'discord.js';
import { Id } from '../../id';
import { Timer } from '../../util';
import { StartingStateDelay } from '../constants';

export function newGame(guildContext: GuildContext, channel: Discord.TextChannel, initiator: Discord.User): Action {
  const context = new MafiaGameContext(guildContext, channel, Id.create(), initiator)

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
    Send(context.channel, new GameStartedMessage(undefined, context)),
    DelayedAction(StartingStateDelay, onTimeout),
    NewState(new StartingState(context, [initiator], Timer.begin())),
  )
}