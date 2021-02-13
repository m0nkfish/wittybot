import { BeginFactory } from './begin';
import { InFactory } from './in';
import { OutFactory } from './out';
import { GetScoresFactory } from './scores';
import { SkipFactory } from './skip';
import { SubmitFactory } from './submit';
import { VoteFactory } from './vote';

export const AllWittyCommands =
  BeginFactory
    .combine(InFactory)
    .combine(OutFactory)
    .combine(GetScoresFactory)
    .combine(SkipFactory)
    .combine(SubmitFactory)
    .combine(VoteFactory)