import { GlobalContext, GuildContext } from './context';
import { IdleState, AnyGameState } from './state';
import { Action, AddUserToRole, RemoveUserFromRole, CompositeAction, Send } from './actions';
import * as Discord from 'discord.js';
import { Command, GetScores, Help, NotifyMe, UnnotifyMe } from './commands';
import { getNotifyRole } from './notify';
import { BasicMessage, HelpMessage } from './messages';
import * as db from './db'

export class Engine {
  state: AnyGameState

  constructor(readonly context: GuildContext) {
    this.state = new IdleState(context)
  }

  getCommand(message: Discord.Message): Command | undefined {
    if (message.channel instanceof Discord.NewsChannel) {
      return
    }
    const source = message.channel instanceof Discord.TextChannel ? message.channel : message.author
    if (message.content === '!help') {
      return Help(source)
    }
    if (message.content === '!notify' && message.member) {
      return NotifyMe(message.member)
    }
    if (message.content === '!unnotify' && message.member) {
      return UnnotifyMe(message.member)
    }

    const command = this.state.interpreter(message)
    if (command) {
      return command
    }
  }

  getAction(command: Command) {
    const action = this.state.receive(command)

    if (action) {
      return action
    }

    if (command.type === 'notify-me') {
      const role = getNotifyRole(command.member.guild)
      if (role) {
        return CompositeAction(
          AddUserToRole(command.member, role),
          Send(command.member.user, new BasicMessage(`Wittybot will alert you when a new game is begun. **!unnotify** to remove`))
        )
      }
    }

    if (command.type === 'unnotify-me') {
      const role = getNotifyRole(command.member.guild)
      if (role) {
        return CompositeAction(
          RemoveUserFromRole(command.member, role),
          Send(command.member.user, new BasicMessage(`Wittybot will no longer alert you when a new game is begun`))
        )
      }
    }

    if (command.type === 'help') {
      return Send(command.source, new HelpMessage())
    }
  }

  run() {
    this.context.globalCtx.client.on('message', message => {
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

  interpret = (action: Action): typeof handled => {
    this.log(action)
    switch (action.type) {
      case 'composite-action':
        action.actions.forEach(this.interpret)
        return handled
      case 'promise-action':
        action.promise.then(action => this.interpret(action))
        return handled
      case 'from-state-action':
        this.interpret(action.getAction(this.state))
        return handled
      case 'new-state':
        this.state = action.newState
        return handled
      case 'send-message':
        const content = action.message.content
        if (content instanceof Discord.MessageEmbed) {
          content.setColor('#A4218A')
        }
        action.destination.send(content)
          .then(msg => action.message.onSent?.(msg, () => this.state))
        return handled
      case 'add-user-to-role':
        action.member.roles.add(action.role)
        return handled
      case 'remove-user-from-role':
        action.member.roles.remove(action.role)
        return handled
      case 'save-round':
        db.saveRound(action.round)
        return handled
      case 'null-action':
        return handled
    }
  }

  log = (action: Action) => {
    if (action.type === 'promise-action') {
      console.log('promise_action')
    } else if (action.type === 'new-state') {
      console.log('new_state_action', `state=${name(action.newState)}`)
    } else if (action.type === 'send-message') {
      console.log('send_message', `message=${name(action.message)}`)
    }
  }
}

const name = (obj: any) => obj?.constructor?.name

const handled = Symbol()