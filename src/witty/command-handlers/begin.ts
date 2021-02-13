import { CommandHandler } from '../../command-handler';
import { IdleState } from '../../state';
import { newGame } from '../state';
import { Begin } from '../commands';

export const BeginHandler = CommandHandler.build.state(IdleState).command(Begin).sync((state, command) => 
  newGame(state.context, command.channel, command.user, command.timeout, command.minPlayers, command.race))