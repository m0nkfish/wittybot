import { In, Out } from '../../commands';
import { Begin } from './begin';
import { GetScores } from './scores';
import { Skip } from './skip';
import { Submit } from './submit';
import { Vote } from './vote';
import { Notify } from './notify';
import { Unnotify } from './unnotify';

export type WittyCommand =
  | ReturnType<typeof Begin>
  | ReturnType<typeof Submit>
  | ReturnType<typeof Vote>
  | ReturnType<typeof Skip>
  | ReturnType<typeof GetScores>
  | ReturnType<typeof Notify>
  | ReturnType<typeof Unnotify>
  | ReturnType<typeof In>
  | ReturnType<typeof Out>
