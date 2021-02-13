import { BeginHandler } from './begin';
import { InHandler } from './in';
import { OutHandler } from './out';
import { SkipHandler } from './skip';
import { SubmitHandler } from './submit';
import { VoteHandler } from './vote';
import { NotifyHandler } from './notify';
import { UnnotifyHandler } from './unnotify';
import { GetScoresHandler } from './scores';

export const AllWittyCommandHandlers =
  BeginHandler
    .orElse(InHandler)
    .orElse(OutHandler)
    .orElse(SkipHandler)
    .orElse(SubmitHandler)
    .orElse(VoteHandler)
    .orElse(NotifyHandler)
    .orElse(UnnotifyHandler)
    .orElse(GetScoresHandler)