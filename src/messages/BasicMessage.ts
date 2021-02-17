import { Message } from './index'
import { StaticMessage } from './Message';

export class BasicMessage implements StaticMessage {
  readonly type = 'static'
  
  constructor(readonly content: string) { }
}