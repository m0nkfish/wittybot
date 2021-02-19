import { In, Out, Start } from '../../commands';
import { Items } from '../../util';
import { Begin } from './begin';
import { Distract } from './distract';
import { Idle } from './idle';
import { Kill } from './kill';
import { Protect } from './protect';
import { Retract } from './retract';
import { Track } from './track';
import { Vote } from './vote';

export const NightCommands = [Distract, Track, Kill, Protect, Idle]
export type NightCommandFactory = Items<typeof NightCommands>
export type NightCommand = ReturnType<NightCommandFactory>

export const DayCommands = [Vote]
export type DayCommandFactory = Items<typeof DayCommands>
export type DayCommand = ReturnType<DayCommandFactory>

export type RoleCommandFactory = NightCommandFactory | DayCommandFactory

export type MafiaCommand =
  | ReturnType<typeof Begin>
  | ReturnType<typeof In>
  | ReturnType<typeof Out>
  | ReturnType<typeof Start>
  | ReturnType<typeof Retract>
  | ReturnType<RoleCommandFactory>
