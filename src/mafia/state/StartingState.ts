import * as Discord from 'discord.js';
import wu from 'wu';
import { CompositeAction } from '../../actions';
import { shuffle } from '../../random';
import { GameState } from '../../state';
import { Timer } from '../../util';
import { MinPlayers, StartingStateDelay } from '../constants';
import { MafiaGameContext } from '../context';
import { Player, Status } from '../model/Player';
import { Players as Players } from '../model/Players';
import { Role } from '../model/Role';
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
      NightState.enter(this.context.firstRound(), statuses))
  }
}

function allocate(users: Discord.User[]): Players {
  if (users.length < MinPlayers) {
    throw new Error(`At least ${MinPlayers} required`)
  }

  const players = wu.zip(shuffle(users), roles())
    .map(([player, role]) => new Player(player, role, Status.Alive()))
    .toArray()

  return new Players(players)
}

function* roles(): Generator<Role, void, undefined> {
  yield* [
    Role.Bodyguard,
    Role.Mafia,
    Role.Escort,
    Role.Mafia,
    Role.Werewolf,
    Role.Inspector,
    Role.Villager,
    Role.Villager,
  ]
  while (true) {
    yield Role.Villager
  }
}
