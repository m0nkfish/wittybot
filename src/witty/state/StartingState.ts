import * as Discord from 'discord.js'
import { CompositeAction, Send } from '../actions';
import { WittyGameContext } from '../context';
import { newRound } from './newRound';
import { BasicMessage, mention } from '../../messages';
import { GameState } from '../../state';

/** Waiting for enough people to demonstrate interest */
export class StartingState implements GameState<WittyGameContext> {

  constructor(readonly context: WittyGameContext, readonly interested: Discord.User[]) { }

  isInterested = (user: Discord.User) =>
    this.interested.some(x => x === user)

  addInterested = (user: Discord.User) =>
    new StartingState(this.context, [...this.interested, user])

  removeInterested = (user: Discord.User) =>
    new StartingState(this.context, this.interested.filter(x => x !== user))

  enoughInterest() { return this.interested.length >= this.context.minPlayers }

  begin() {
    return CompositeAction(
      Send(this.context.channel, new BasicMessage(`Let's go! ` + this.interested.map(x => mention(x)).join(' '))),
      newRound(this.context))
  }
}
