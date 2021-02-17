import { BeginFactory } from './begin';
import { InFactory } from './in';
import { OutFactory } from './out';
import { NightActionsFactory } from './night-actions';
import { VoteFactory } from './vote';

export const AllMafiaCommandFactories = () =>
  BeginFactory()
    .combine(InFactory())
    .combine(OutFactory())
    .combine(NightActionsFactory())
    .combine(VoteFactory())