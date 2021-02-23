import * as Discord from 'discord.js';
import { Action, CompositeAction, DelayedAction, FromStateAction, NewState, OptionalAction, PromiseAction, Send } from '../../actions';
import { GuildContext } from '../../context/GuildContext';
import { Id } from '../../id';
import { BasicMessage } from '../../messages';
import { RoleMentionNotifyMessage } from '../../messages/RoleMentionNotifyMessage';
import { Timer } from '../../util';
import { StartingStateDelay } from '../constants';
import { MafiaGameContext, MafiaSettings } from '../context';
import { GameStartedMessage } from '../messages';
import { getNotifyRole } from '../notify';
import { IdleState } from './../../state';
import { StartingState } from './StartingState';

export function newGame(guildContext: GuildContext, settings: MafiaSettings, channel: Discord.TextChannel, initiator: Discord.GuildMember): Action {
  const context = new MafiaGameContext(guildContext, settings, channel, Id.create())

  const gameStartedMessage = getNotifyRole(context.guild)
    .then(role => CompositeAction(
      OptionalAction(role && Send(context.channel, new RoleMentionNotifyMessage(role))),
      Send(context.channel, new GameStartedMessage(context, initiator.user))))

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
    NewState(new StartingState(context, [initiator], Timer.begin())),
    PromiseAction(gameStartedMessage),
  )
}