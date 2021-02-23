import * as Discord from 'discord.js';
import { CompositeAction } from '../../actions';
import { GameState } from '../../state';
import { Timer } from '../../util';
import { StartingStateDelay } from '../constants';
import { MafiaGameContext } from '../context';
import { allocateRoles } from './allocateRoles';
import { NightState } from './NightState';
import { notifyRoles } from './notifyRoles';

/** Waiting for people to sign up to the game */
export class StartingState implements GameState<MafiaGameContext> {

  constructor(
    readonly context: MafiaGameContext,
    readonly interested: Discord.GuildMember[],
    readonly timer: Timer) { }

  remaining = () => StartingStateDelay.subtract(this.timer.duration())

  isInterested = (user: Discord.User) =>
    this.interested.some(x => x.user === user)

  addInterested = (user: Discord.GuildMember) =>
    new StartingState(this.context, [...this.interested, user], this.timer)

  removeInterested = (user: Discord.GuildMember) =>
    new StartingState(this.context, this.interested.filter(x => x !== user), this.timer)

  enoughInterest() { return this.interested.length >= this.context.settings.minPlayers }

  begin() {
    const statuses = allocateRoles(this.interested)
    return CompositeAction(
      notifyRoles(this.context, statuses),
      NightState.enter(this.context.firstRound(), statuses))
  }
}
