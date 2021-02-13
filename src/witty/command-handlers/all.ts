import { BeginHandler } from './begin';
import { InHandler } from './in';
import { OutHandler } from './out';

export const AllCommandHandlers =
  BeginHandler
    .orElse(InHandler)
    .orElse(OutHandler)