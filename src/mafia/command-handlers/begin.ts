import { CommandHandler } from '../../commands';
import { IdleState } from '../../state';
import { Begin } from '../commands';
import { newGame } from '../state';

export const BeginHandler = () => CommandHandler.build.state(IdleState).command(Begin).sync((state, command) => 
  newGame(state.context, command.settings, command.channel, command.user))