import { BeginFactory } from './begin';
import { InFactory } from './in';
import { OutFactory } from './out';
import { NightActionsFactory } from './night-actions';

export const AllWittyCommandFactories = () =>
  BeginFactory()
    .combine(InFactory())
    .combine(OutFactory())
    .combine(NightActionsFactory())