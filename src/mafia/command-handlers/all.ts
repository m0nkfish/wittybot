import { BeginHandler } from './begin';
import { InHandler } from './in';
import { OutHandler } from './out';
import { NightActionHandler } from './night-action';
import { Kill, Track, Protect, Distract } from '../commands';

export const AllWittyCommandHandlers = () =>
  BeginHandler()
    .orElse(InHandler())
    .orElse(OutHandler())
    .orElse(NightActionHandler(Track))
    .orElse(NightActionHandler(Protect))
    .orElse(NightActionHandler(Distract))
    .orElse(NightActionHandler(Kill))