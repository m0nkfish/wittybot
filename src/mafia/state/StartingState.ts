import * as Discord from 'discord.js'
import wu from 'wu'
import { shuffle } from '../../random'

import { CompositeAction } from '../../actions';
import { MafiaGameContext } from '../context';
import { GameState } from '../../state';
import { Timer } from '../../util';
import { MinPlayers, StartingStateDelay } from '../constants';
import { PlayerStatuses } from '../PlayerStatuses';
import { Role } from '../Role';
import { NightState } from './NightState';
import { notifyRoles } from './notifyRoles';

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
    const statuses = allocate(this.interested)
    return CompositeAction(
      notifyRoles(this.context, statuses),
      NightState.enter(this.context, statuses, 0))
  }
}

function allocate(users: Discord.User[]): PlayerStatuses {
  if (users.length < MinPlayers) {
    throw new Error(`At least ${MinPlayers} required`)
  }

  const statuses = wu.zip(shuffle(users), roles())
    .map(([player, role]) => ({ player, role, isAlive: true }))
    .toArray()

  return new PlayerStatuses(statuses)
}

function* roles(): Generator<Role, void, undefined> {
  yield* [
    Role.Hooker,
    Role.Mafia,
    Role.Werewolf,
    Role.Inspector,
    Role.Villager,
    Role.Villager,
    Role.Mafia,
    Role.Bodyguard
  ]
  while (true) {
    yield Role.Villager
  }
}
