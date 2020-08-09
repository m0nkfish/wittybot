import { Context } from './context';
import { IdleState, GameState } from './state';
import { Action } from './actions';

export class Engine {
  state: GameState

  constructor(readonly context: Context) {
    this.state = new IdleState(context)
  }

  run() {
    this.context.client.on('message', message => {
      if (message.author.bot) {
        return
      }

      const command = this.state.interpreter(message)
      if (!command) {
        return
      }
      const action = this.state.receive(command)
      if (!action) {
        return
      }

      this.interpret(action)
    });
  }

  interpret = (action: Action) => {
    if (action.type === 'composite-action') {
      action.actions.forEach(this.interpret);
    } else if (action.type === 'delayed-action') {
      setTimeout(() => this.interpret(action.action), action.delayMs)
    } else if (action.type === 'from-state-action') {
      this.interpret(action.getAction(this.state))
    } else if (action.type === 'new-state') {
      this.state = action.newState
    } else if (action.type === 'post-message') {
      action.channel.send(action.message)
    } else if (action.type === 'embed-message') {
      action.channel.send({ embed: action.embed.setColor('#A4218A') })
    }
  }
}