import { In, Out, Start } from '../../commands';
import { Begin } from './begin';
import { Distract } from './distract';
import { Kill } from './kill';
import { Protect } from './protect';
import { Retract } from './retract';
import { Track } from './track';
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
  | ReturnType<typeof Start>
  | ReturnType<typeof Retract>
  | ReturnType<MafiaRoleCommandFactory>
