import * as Discord from 'discord.js'
import { Command } from '../commands';
import { Action, CompositeAction, Send } from '../actions';
import { WittyGameContext } from '../context';
import { newRound } from './newRound';
import { BasicMessage, mention } from '../../messages';
import { GameState } from '../../state';
import { AllCommandHandlers } from '../command-handlers/all';

/** Waiting for enough people to demonstrate interest */
export class StartingState implements GameState<WittyGameContext> {

  constructor(readonly context: WittyGameContext, readonly interested: Discord.User[]) { }

  receive = (command: Command): Action | undefined => AllCommandHandlers.handle(this, command)

  enoughInterest() { return this.interested.length >= 3 }

  begin() {
    return CompositeAction(
      Send(this.context.channel, new BasicMessage(`Let's go! ` + this.interested.map(x => mention(x)).join(' '))),
      newRound(this.context))
  }
}
