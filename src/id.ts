import { uuid4 } from 'random-js';
import { mt } from './random';

export class Id {
  private constructor(readonly value: string) { }

  eq = (other: Id) => this.value === other.value

  static create = () => new Id(uuid4(mt))

  static fromString = (str: string) => new Id(str)
}