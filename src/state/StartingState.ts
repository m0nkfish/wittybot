import * as Discord from 'discord.js'
import { Command, Interested } from '../commands';
import { Action, NewState, CompositeAction, Send, PromiseAction, OptionalAction, DelayedAction, FromStateAction } from '../actions';
import { GameContext } from '../context';
import { GameState } from './GameState';
import { newRound } from './newRound';
import { getNotifyRole } from '../notify';
import { GameStartedMessage, BasicMessage } from '../messages';
import { IdleState } from './IdleState';

/** Waiting for enough people to demonstrate interest */
export class StartingState implements GameState<GameContext> {

  constructor(readonly context: GameContext, readonly interested: Discord.User[]) { }

  interpreter(message: Discord.Message): Command | undefined {
    if (!(message.channel instanceof Discord.TextChannel) || !message.member) {
      return
    }

    if (message.content === '!in') {
      return Interested(message.member)
    }
  }

  receive(command: Command): Action | undefined {
    if (command.type === 'interested' && !this.interested.some(x => x === command.member.user)) {
      const interested = [...this.interested, command.member.user]
      if (interested.length >= 3) {
        return newRound(this.context)
      } else {
        return NewState(new StartingState(this.context, interested))
      }
    }
  }

  static begin(context: GameContext): Action {
    const gameStartedMessage = getNotifyRole(context.channel.guild)
      .then(role => Send(context.channel, new GameStartedMessage(role, context.initiator, context.gameId)))

    const cancel = 
      FromStateAction(context.channel.guild, state =>
        OptionalAction(state instanceof StartingState && state.context.gameId.eq(context.gameId) &&
          CompositeAction(
            Send(context.channel, new BasicMessage(`Not enough players to begin the game`)),
            NewState(new IdleState(context.guildCtx))
          )
        ))
    
    return CompositeAction(
      PromiseAction(gameStartedMessage),
      DelayedAction(StartingState.StartingStateDelayMs, cancel),
      NewState(new StartingState(context, [context.initiator])),
    )
  }

  static StartingStateDelayMs = 1000 * 60 * 5
}
