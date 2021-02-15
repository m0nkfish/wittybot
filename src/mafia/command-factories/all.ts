import { BeginFactory } from './begin';
import { InFactory } from './in';
import { OutFactory } from './out';

export const AllWittyCommandFactories = () =>
  BeginFactory()
    .combine(InFactory())
    .combine(OutFactory())
