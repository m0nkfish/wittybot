import * as Discord from 'discord.js';
import wu from 'wu';
import { choose, flipCoin, oneOf, sample, shuffle } from '../../random';
import { AllRoles, Player, Players, Role, Status, Team } from '../model';

export function allocateRoles(users: Discord.User[]): Players {
  users = shuffle(users)

  const players = wu.zip(users, wu.chain(chooseRoles(users.length), wu.repeat(Role.Villager)))
    .map(([player, role]) => new Player(player, role, Status.Alive()))
    .toArray()

  return new Players(players)
}

function chooseRoles(n: number): Iterable<Role> {
  const loneMaf = Role.Mafia
  const mafia = [Role.Mafia, Role.Mafia]
  const yakuza = [Role.Yakuza, Role.Yakuza]
  const wolf = Role.Werewolf
  const bg = Role.Bodyguard
  const esc = Role.Escort
  const jk = Role.Jester
  const insp = Role.Inspector

  switch (n) {
    case 2:
    case 3: return [loneMaf, bg]
    case 4: return oneOf(
      [loneMaf, bg],
      [loneMaf, esc]
    )
    case 5: return oneOf(
      [wolf, loneMaf, insp],
      [wolf, insp],
      [wolf, bg, esc]
    )
    case 6: return oneOf(
      [wolf, loneMaf, insp, bg, esc],
      [wolf, insp, esc]
    )
    case 7: return oneOf(
      [...mafia, insp, bg],
      [loneMaf, wolf, insp, esc],
      [loneMaf, wolf, insp, esc, bg, jk]
    )
    case 8: return oneOf(
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
