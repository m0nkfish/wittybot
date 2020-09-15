import { Message } from './index'

export class BasicMessage implements Message {
  constructor(readonly content: string) { }
}