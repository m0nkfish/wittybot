import { BeginHandler } from './begin';
import { InHandler } from './in';
import { OutHandler } from './out';
import { NightActionHandler } from './night-action';
import { Kill, Track, Protect, Distract } from '../commands';
import { VoteHandler } from './vote';
import { StartHandler } from './start';

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