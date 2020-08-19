import { GlobalContext, GuildContext } from './context';
import { IdleState, AnyGameState } from './state';
import { Action, AddUserToRole, RemoveUserFromRole, CompositeAction, Send } from './actions';
import * as Discord from 'discord.js';
import { Command, GetScores, Help, NotifyMe, UnnotifyMe } from './commands';
import { getNotifyRole } from './notify';
import { BasicMessage, HelpMessage } from './messages';
import * as db from './db'

// general: !help

// guild scoped: !notify, !unnotify, !witty, !scores

// game scoped: submit, vote

class ScopedCommand {
  constructor(readonly command: Command, readonly guild: Discord.Guild) {}
}

class ScopedAction {
  constructor(readonly action: Action, readonly guild: Discord.Guild) {}
}

export class Engine {
  states: Map<Discord.Guild, AnyGameState>

  constructor(readonly context: GlobalContext) {
    this.states = new Map()
  }

  getCommand(message: Discord.Message): Command | ScopedCommand | undefined {
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

    if (message.channel instanceof Discord.TextChannel) {
      const state = this.states.get(message.channel.guild)
      if (state) {
        const command = state.interpreter(message)
        if (command) {
          return new ScopedCommand(command, message.channel.guild)
        }
      }
    } else if (message.channel instanceof Discord.DMChannel) {
      const commands = this.context.client.guilds.cache
        .filter(g => g.member(message.author) !== null)
        .map(g => {
          const state = this.states.get(g)
          if (state) {
            const command = state.interpreter(message)
            if (command) {
              return new ScopedCommand(command, g)
            }
          }
        })
        .filter(cmd => !!cmd) as ScopedCommand[]

      if (commands.length === 0) {
        return
      }

      if (commands.length > 1) {
        message.reply(`Sorry, could not establish which server you meant to send this command to; `)
        return
      }

      return commands[0]
    }

  }

  getAction(command: Command | ScopedCommand): Action | undefined {

    if (command instanceof ScopedCommand) {
      let state = this.states.get(command.guild)
      if (!state) {
        state = new IdleState(new GuildContext(this.context, command.guild))
        this.states.set(command.guild, state)
      }
      return state.receive(command.command)
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
        const state = this.states.get(action.guild)
        if (state) {
          this.interpret(action.getAction(state))
        }
        return handled
      case 'new-state':
        this.states.set(action.newState.context.guild, action.newState)
        return handled
      case 'send-message':
        const content = action.message.content
        if (content instanceof Discord.MessageEmbed) {
          content.setColor('#A4218A')
        }
        action.destination.send(content)
          .then(msg => {
            if (msg.guild) {
              const state = this.states.get(msg.guild)
              if (state) {
                action.message.onSent?.(msg, () => state)
              }
            }
          })
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
      const guild = action.newState.context.guild
      console.log('new_state_action', `guild=${guild.name} state=${name(action.newState)} guild_id=${guild.id}`)
    } else if (action.type === 'send-message') {
      console.log('send_message', `message=${name(action.message)}`)
    }
  }
}

const name = (obj: any) => obj?.constructor?.name

const handled = Symbol()