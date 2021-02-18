import { Distract, Kill, Protect, Track } from '../commands';
import { BeginHandler } from './begin';
import { InHandler } from './in';
import { NightActionHandler } from './night-action';
import { OutHandler } from './out';
import { RetractNightActionHandler } from './retract-night-action';
import { RetractVoteHandler } from './retract-vote';
import { StartHandler } from './start';
import { VoteHandler } from './vote';

export const AllMafiaCommandHandlers = () =>
  BeginHandler()
    .orElse(InHandler())
    .orElse(OutHandler())
    .orElse(NightActionHandler(Track))
    .orElse(NightActionHandler(Protect))
    .orElse(NightActionHandler(Distract))
    .orElse(NightActionHandler(Kill))
    .orElse(VoteHandler())
    .orElse(StartHandler())
    .orElse(RetractNightActionHandler())
    .orElse(RetractVoteHandler())