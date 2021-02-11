import { uuid4 } from 'random-js';
import { mt } from './random';

export type Id = string & { __brand: 'id' }
export const Id = {
  fromString: (str: string) => str as Id,
  create: () => Id.fromString(uuid4(mt))
}
