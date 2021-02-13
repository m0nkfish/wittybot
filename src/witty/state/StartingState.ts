import * as Discord from 'discord.js'
import { CompositeAction, Send } from '../actions';
import { WittyGameContext } from '../context';
import { newRound } from './newRound';
import { BasicMessage, mention } from '../../messages';
import { GameState } from '../../state';
import { Timer } from '../../util';
import { StartingStateDelay } from './newGame';

/** Waiting for enough people to demonstrate interest */
export class StartingState implements GameState<WittyGameContext> {

  constructor(
    readonly context: WittyGameContext,
    readonly interested: Discord.User[],
    readonly timer: Timer) { }

  remaining = () => StartingStateDelay.subtract(this.timer.duration())

  isInterested = (user: Discord.User) =>
    this.interested.some(x => x === user)

  addInterested = (user: Discord.User) =>
    new StartingState(this.context, [...this.interested, user], this.timer)

  removeInterested = (user: Discord.User) =>
    new StartingState(this.context, this.interested.filter(x => x !== user), this.timer)

  enoughInterest() { return this.interested.length >= this.context.minPlayers }

  begin() {
    return CompositeAction(
      Send(this.context.channel, new BasicMessage(`Let's go! ` + this.interested.map(x => mention(x)).join(' '))),
      newRound(this.context))
  }
}
