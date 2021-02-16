import { In, Out } from '../../commands';
import { Begin } from './begin';
import { Distract } from './distract';
import { Track } from './track';
import { Kill } from './kill';
import { Protect } from './protect';
import { Vote } from './vote';

export type MafiaRoleCommandFactory =
  | typeof Distract
  | typeof Track
  | typeof Kill
  | typeof Protect
  | typeof Vote

export type MafiaCommand =
  | ReturnType<typeof Begin>
  | ReturnType<typeof In>
  | ReturnType<typeof Out>
  | ReturnType<MafiaRoleCommandFactory>
