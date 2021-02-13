import { CommandHandler } from '../../command-handler';
import { IdleState } from '../../state';
import { newGame } from '../state';
import { Begin } from '../commands';

export const BeginHandler = new CommandHandler((state, command) => {
  if (state instanceof IdleState && command.type === Begin.type) {
    return newGame(state.context, command.channel, command.user, command.timeoutSec, command.minPlayers, command.race)
  }
})