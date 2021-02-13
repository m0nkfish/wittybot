import { Begin, BeginFactory } from './begin';
import { In, InFactory } from './in';
import { Out, OutFactory } from './out';
import { GetScores, GetScoresFactory } from './scores';
import { Skip, SkipFactory } from './skip';
import { Submit, SubmitFactory } from './submit';
import { Vote, VoteFactory } from './vote';
import { Notify, NotifyFactory } from './notify';
import { Unnotify, UnnotifyFactory } from './unnotify';
import { Help } from './help';

export const AllWittyCommands =
  BeginFactory
    .combine(NotifyFactory)
    .combine(UnnotifyFactory)
    .combine(InFactory)
    .combine(OutFactory)
    .combine(GetScoresFactory)
    .combine(SkipFactory)
    .combine(SubmitFactory)
    .combine(VoteFactory)

export type Command =
  | ReturnType<typeof Begin>
  | ReturnType<typeof Submit>
  | ReturnType<typeof Vote>
  | ReturnType<typeof Skip>
  | ReturnType<typeof GetScores>
  | ReturnType<typeof Notify>
  | ReturnType<typeof Unnotify>
  | ReturnType<typeof Help>
  | ReturnType<typeof In>
  | ReturnType<typeof Out>
