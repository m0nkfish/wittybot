import { In, Out } from '../../commands';
import { Begin } from './begin';
import { Distract } from './distract';
import { Inspect } from './inspect';
import { Kill } from './kill';
import { Protect } from './protect';
import { Vote } from './vote';

export type MafiaRoleCommand =
  | ReturnType<typeof Distract>
  | ReturnType<typeof Inspect>
  | ReturnType<typeof Kill>
  | ReturnType<typeof Protect>
  | ReturnType<typeof Vote>

export type MafiaCommand =
  | ReturnType<typeof Begin>
  | ReturnType<typeof In>
  | ReturnType<typeof Out>
  | MafiaRoleCommand
