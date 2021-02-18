import { BeginFactory } from './begin';
import { InFactory } from './in';
import { NightActionsFactory } from './night-actions';
import { OutFactory } from './out';
import { RetractNightActionFactory } from './retract-night-action';
import { RetractVoteFactory } from './retract-vote';
import { StartFactory } from './start';
import { VoteFactory } from './vote';

export const AllMafiaCommandFactories = () =>
  BeginFactory()
    .combine(InFactory())
    .combine(OutFactory())
    .combine(NightActionsFactory())
    .combine(VoteFactory())
    .combine(StartFactory())
    .combine(RetractNightActionFactory())
    .combine(RetractVoteFactory())