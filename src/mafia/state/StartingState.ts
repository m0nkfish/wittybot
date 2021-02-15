import * as Discord from 'discord.js'
import { CompositeAction, NewState, Send } from '../../actions';
import { MafiaGameContext } from '../context';
import { BasicMessage, mention } from '../../messages';
import { GameState, IdleState } from '../../state';
import { Timer } from '../../util';
import { MinPlayers, StartingStateDelay } from '../constants';

/** Waiting for people to sign up to the game */
export class StartingState implements GameState<MafiaGameContext> {

  constructor(
    readonly context: MafiaGameContext,
    readonly interested: Discord.User[],
    readonly timer: Timer) { }

  remaining = () => StartingStateDelay.subtract(this.timer.duration())

  isInterested = (user: Discord.User) =>
    this.interested.some(x => x === user)

  addInterested = (user: Discord.User) =>
    new StartingState(this.context, [...this.interested, user], this.timer)

  removeInterested = (user: Discord.User) =>
    new StartingState(this.context, this.interested.filter(x => x !== user), this.timer)

  enoughInterest() { return this.interested.length >= MinPlayers }

  begin() {
    return CompositeAction(
      Send(this.context.channel, new BasicMessage(`Let's go! ` + this.interested.map(x => mention(x)).join(' '))),
      NewState(new IdleState(this.context)))
  }
}
