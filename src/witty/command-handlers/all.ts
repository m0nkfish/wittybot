import { BeginHandler } from './begin';
import { InHandler } from './in';
import { OutHandler } from './out';
import { GetScoresHandler } from './scores';
import { SkipHandler } from './skip';
import { SubmitHandler } from './submit';
import { VoteHandler } from './vote';

export const AllWittyCommandHandlers = () =>
  BeginHandler()
    .orElse(InHandler())
    .orElse(OutHandler())
    .orElse(SkipHandler())
    .orElse(SubmitHandler())
    .orElse(VoteHandler())
    .orElse(GetScoresHandler())