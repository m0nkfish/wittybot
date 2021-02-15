import { In, Out } from '../../commands';
import { Begin } from './begin';

export type MafiaCommand =
  | ReturnType<typeof Begin>
  | ReturnType<typeof In>
  | ReturnType<typeof Out>
