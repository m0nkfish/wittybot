import { BeginFactory } from './begin';
import { InFactory } from './in';
import { OutFactory } from './out';
import { NightActionsFactory } from './night-actions';
import { VoteFactory } from './vote';
import { StartFactory } from './start';

export const AllMafiaCommandFactories = () =>
  BeginFactory()
    .combine(InFactory())
    .combine(OutFactory())
    .combine(NightActionsFactory())
    .combine(VoteFactory())
    .combine(StartFactory())