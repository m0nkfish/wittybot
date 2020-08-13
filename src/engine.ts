import { Context } from './context';
import { IdleState, GameState } from './state';
import { Action, EmbedMessage, AddUserToRole, RemoveUserFromRole, CompositeAction, Message } from './actions';
import * as Discord from 'discord.js';
import { Command, GetScores, Help, NotifyMe, UnnotifyMe } from './commands';
import { getNotifyRole } from './notify';
import { promptsCount } from './prompts';

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

    if (message.content === '!scores') {
      const channel = message.channel instanceof Discord.TextChannel ? message.channel : message.author.dmChannel
      return GetScores(message.author, channel)
    }
    if (message.content === '!help' && (message.channel instanceof Discord.TextChannel || message.channel instanceof Discord.DMChannel)) {
      return Help(message.author, message.channel)
    }
    if (message.content === '!notify' && message.member) {
      return NotifyMe(message.member)
    }
    if (message.content === '!unnotify' && message.member) {
      return UnnotifyMe(message.member)
    }
  }

  getAction(command: Command) {
    const action = this.state.receive(command)

    if (action) {
      return action
    }

    if (command.type === 'get-scores') {
      return this.state.context.scores.show(command.channel)
    }

    if (command.type === 'notify-me') {
      const role = getNotifyRole(command.member.guild)
      if (role) {
        return CompositeAction([
          AddUserToRole(command.member, role),
          Message(command.member.user, `Wittybot will alert you when a new game is begun. **!unnotify** to remove`)
        ])
      }
    }

    if (command.type === 'unnotify-me') {
      const role = getNotifyRole(command.member.guild)
      if (role) {
        return CompositeAction([
          RemoveUserFromRole(command.member, role),
          Message(command.member.user, `Wittybot will no longer alert you when a new game is begun`)
        ])
      }
    }

    if (command.type === 'help') {
      return EmbedMessage(command.channel, new Discord.MessageEmbed()
        .setTitle('Wittybot help')
        .setDescription([
          `Wittybot is a simple, fast-paced text game where you submit text answers to prompts, then vote for the funniest one.`
        ])
        .addField('commands', [
          `**!help** - you're looking at it`,
          `**!witty** - start a new game`,
          `**!skip** - skip the current prompt`,
          `**!notify** - be notified when a new game starts`,
          `**!unnotify** - stop being notified when a new game starts`,
          `**!scores** - view the scoreboard`
        ])
        .setFooter(`This version has ${promptsCount} miscellaneous prompts, quotes, lyrics, headlines and proverbs`))
        
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
      action.destination.send(action.message)
    } else if (action.type === 'embed-message') {
      action.destination.send({ embed: action.embed.setColor('#A4218A') })
    } else if (action.type === 'add-user-to-role') {
      action.member.roles.add(action.role)
    } else if (action.type === 'remove-user-from-role') {
      action.member.roles.remove(action.role)
    }
  }
}