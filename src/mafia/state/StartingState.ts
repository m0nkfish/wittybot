import * as Discord from 'discord.js';
import wu from 'wu';
import { CompositeAction } from '../../actions';
import { choose, chooseRandom, flipCoin, sample, shuffle } from '../../random';
import { GameState } from '../../state';
import { Timer } from '../../util';
import { StartingStateDelay } from '../constants';
import { MafiaGameContext } from '../context';
import { Player, Status } from '../model/Player';
import { Players as Players } from '../model/Players';
import { AllRoles, Role, Team } from '../model/Role';
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

  enoughInterest() { return this.interested.length >= this.context.settings.minPlayers }

  begin() {
    const statuses = allocate(this.interested)
    return CompositeAction(
      notifyRoles(this.context, statuses),
      NightState.enter(this.context.firstRound(), statuses))
  }
}

function allocate(users: Discord.User[]): Players {
  users = shuffle(users)

  const players = wu.zip(users, wu.chain(chooseRoles(users.length), wu.repeat(Role.Villager)))
    .map(([player, role]) => new Player(player, role, Status.Alive()))
    .toArray()

  return new Players(players)
}

function chooseRoles(n: number): Iterable<Role> {
  const mafia = [Role.Mafia, Role.Mafia]
  const yakuza = [Role.Yakuza, Role.Yakuza]
  const wolf = Role.Werewolf
  const bg = Role.Bodyguard
  const esc = Role.Escort
  const jk = Role.Jester
  const insp = Role.Inspector

  switch (n) {
    case 2:
    case 3: return chooseRandom(
      [wolf, bg]
    )
    case 4: return chooseRandom(
      [wolf, bg],
      [wolf, esc]
    )
    case 5: return chooseRandom(
      [...mafia, insp],
      [wolf, insp]
    )
    case 6: return chooseRandom(
      [...mafia, insp],
      [wolf, insp, esc]
    )
    case 7: return chooseRandom(
      [...mafia, insp, bg],
      [...mafia, wolf, insp, esc],
      [...mafia, wolf, insp, esc, bg, jk]
    )
    case 8: return chooseRandom(
      [...mafia, insp, esc, bg, jk],
      [...mafia, wolf, insp, esc, bg],
      [...mafia, ...yakuza, insp, esc, bg],
    )

    default: {
      const villains = sample(choose(1, 3), [mafia, yakuza, [wolf]]).flat()
      const jester = flipCoin() ? [jk] : []
      return wu.chain(villains, jester, AllRoles.filter(x => x.team === Team.Townsfolk), wu.repeat(Role.Villager))
    }
  }

}
