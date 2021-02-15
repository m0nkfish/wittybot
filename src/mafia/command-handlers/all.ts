import { BeginHandler } from './begin';
import { InHandler } from './in';
import { OutHandler } from './out';

export const AllWittyCommandHandlers = () =>
  BeginHandler()
    .orElse(InHandler())
    .orElse(OutHandler())