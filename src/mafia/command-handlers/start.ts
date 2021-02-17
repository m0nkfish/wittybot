import { CommandHandler } from '../../commands';
import { StartingState } from '../state';
import { Start } from '../../commands';

export const StartHandler = () => CommandHandler.build.state(StartingState).command(Start)
  .sync(state => state.begin())