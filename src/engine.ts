import { Context } from './context';
import { IdleState, GameState } from './state';
import { Action, EmbedMessage } from './actions';
import * as Discord from 'discord.js';
import { Command, GetScores } from './commands';

export class Engine {
  state: GameState

  constructor(readonly context: Context) {
    this.state = new IdleState(context)
  }

  getCommand(message: Discord.Message): Command | undefined {
    const command = this.state.interpreter(message)
    if (command) {
      return command
    }

    if (message.content === "!scores") {
      const channel = message.channel instanceof Discord.TextChannel ? message.channel : message.author.dmChannel
      return GetScores(message.author, channel)
    }
  }

  getAction(command: Command) {
    const action = this.state.receive(command)

    if (action) {
      return action
    }

    if (command.type === 'get-scores') {
      return EmbedMessage(command.channel, new Discord.MessageEmbed()
        .setTitle(`Scores on the doors...`)
        .setDescription(
          `The scores (since the bot was last restarted!) are:\n` +
          this.state.context.scores.inOrder()
            .map(([user, score]) => `${score} points: ${user.username}`)
            .join('; ')))
    }
  }

  run() {
    this.context.client.on('message', message => {
      if (message.author.bot) {
        return
      }

      const command = this.getCommand(message)
      if (!command) {
        return
      }
      
      const action = this.getAction(command)
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