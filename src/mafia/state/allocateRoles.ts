import * as Discord from 'discord.js';
import wu from 'wu';
import { choose, flipCoin, oneOf, sample, shuffle } from '../../random';
import { Player, Players, Role, Status } from '../model';

export function allocateRoles(users: Discord.User[]): Players {
  users = shuffle(users)

  const players = wu.zip(users, wu.chain(chooseRoles(users.length), wu.repeat(Role.Villager)))
    .map(([player, role]) => new Player(player, role, Status.Alive()))
    .toArray()

  return new Players(players)
}

function chooseRoles(n: number): Iterable<Role> {
  const { Mafia, Yakuza, Werewolf, Bodyguard, Escort, Jester, Inspector, Mayor } = Role

  const townRoles = [Bodyguard, Escort, Inspector, Mayor]
  const maybeJester = flipCoin() ? [Jester] : []

  switch (n) {
    case 2:
    case 3:
    case 4: return oneOf(
      [Mafia, Mayor],
      [Mafia, Escort]
    )
    case 5: return oneOf(
      [Werewolf, Mafia, ...sample(3, townRoles)],
      [oneOf<Role>(Werewolf, Mafia), ...sample(2, townRoles)],
    )
    case 6: 
    case 7: return oneOf(
      [oneOf<Role>(Werewolf, Mafia), Jester, ...sample(3, townRoles)],
      [Werewolf, Mafia, ...maybeJester, ...sample(4, townRoles)],
      [Mafia, Mafia, ...sample(4, townRoles)]
    )
    case 8: return oneOf(
      [Mafia, Mafia, ...sample(4, townRoles)],
      [Mafia, Mafia, Werewolf, ...sample(4, townRoles)],
    )

    default: {
      const villains = sample(choose(2, 3), [[Mafia, Mafia], [Yakuza, Yakuza], [Werewolf]]).flat()
      return wu.chain<Role>(villains, maybeJester, townRoles, wu.repeat(Role.Villager))
    }
  }

}
