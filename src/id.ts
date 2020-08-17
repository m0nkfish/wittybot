import { uuid4 } from 'random-js';
import { mt } from './random';

export class Id {
  private constructor(readonly value: string) { }

  static create = () => new Id(uuid4(mt))
}