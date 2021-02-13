import { BeginHandler } from './begin';
import { InHandler } from './in';
import { OutHandler } from './out';
import { SkipHandler } from './skip';
import { SubmitHandler } from './submit';

export const AllCommandHandlers =
  BeginHandler
    .orElse(InHandler)
    .orElse(OutHandler)
    .orElse(SkipHandler)
    .orElse(SubmitHandler)