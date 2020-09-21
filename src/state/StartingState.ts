import * as Discord from 'discord.js'
import { Command, Interested, Uninterested } from '../commands';
import { Action, NewState, CompositeAction, Send, OptionalAction } from '../actions';
import { GameContext } from '../context';
import { GameState } from './GameState';
import { newRound } from './newRound';
import { BasicMessage, mention } from '../messages';

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
    if (message.content === '!out') {
      return Uninterested(message.member)
    }
  }

  receive(command: Command): Action | undefined {
    if (command.type === 'interested' && !this.interested.some(x => x === command.member.user)) {
      const interested = [...this.interested, command.member.user]
      return CompositeAction(
        NewState(new StartingState(this.context, interested)),
        OptionalAction(interested.length === 5 && this.begin())
      )
    }

    if (command.type === 'uninterested' && this.interested.some(x => x === command.member.user)) {
      return NewState(new StartingState(this.context, this.interested.filter(x => x !== command.member.user)))
    }
  }

  enoughInterest() { return this.interested.length >= 3 }

  begin() {
    return CompositeAction(
      Send(this.context.channel, new BasicMessage(`Let's go! ` + this.interested.map(x => mention(x)).join(' '))),
      newRound(this.context))
  }
}
