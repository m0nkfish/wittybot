import { GlobalContext, GuildContext } from '../context'
import { IdleState, AnyGameState } from '../state';
import { Action, Send } from './actions';
import * as Discord from 'discord.js';
import { HelpMessage } from '../messages';
import * as db from './db'
import { log } from '../log';
import { logUser, logMember, logSource, logGuild, logChannel, getName, logMessage, logState } from './loggable';
import { Command, Begin, Skip, Submit, Vote, GetScores, In, Out, Notify, Unnotify, AllWittyCommands, Help } from './commands';
import { AllCommandHandlers } from './command-handlers';

class ScopedCommand {
  constructor(readonly command: Command, readonly guild: Discord.Guild) {}
}

export class Engine {
  guildStates: Map<Discord.Guild, AnyGameState>

  constructor(readonly context: GlobalContext) {
    this.guildStates = new Map()
  }

  getState(guild: Discord.Guild): AnyGameState {
    let state = this.guildStates.get(guild)
    if (!state) {
      state = new IdleState(new GuildContext(this.context, guild))
      this.guildStates.set(guild, state)
    }
    return state
  }

  getCommand(message: Discord.Message): Command | ScopedCommand | undefined {
    if (message.channel instanceof Discord.NewsChannel) {
      return 
    }
    const source = message.channel instanceof Discord.TextChannel ? message.channel : message.author
    if (message.content === '!help') {
      return Help(source)
    }

    if (message.channel instanceof Discord.TextChannel) {
      const state = this.getState(message.channel.guild)
      const command = AllWittyCommands.process(state, message)
      if ((<string[]>[GetScores.type]).includes(command?.type ?? '')) { // TODO: remove this hack
        return command
      }
      if (command) {
        return new ScopedCommand(command, message.channel.guild)
      }
    } else if (message.channel instanceof Discord.DMChannel) {
      const commands = this.context.client.guilds.cache
        .filter(g => g.member(message.author) !== null)
        .map(g => {
          const state = this.getState(g)
          if (state) {
            const command = AllWittyCommands.process(state, message)
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
        message.reply(`Sorry, could not establish which server you meant to send this command to`)
        return
      }

      return commands[0]
    }

  }

  async getAction(command: Command | ScopedCommand): Promise<Action | undefined> {
    this.logCommand(command)

    if (command instanceof ScopedCommand) {
      return AllCommandHandlers.handle(this.getState(command.guild), command.command)
    }

    if (command.type === 'help') {
      return Send(command.source, new HelpMessage())
    }
  }

  run() {
    this.context.client.on('message', async message => {
      if (message.author.bot) {
        return
      }

      const command = this.getCommand(message)
      if (!command) {
        return
      }

      const action = await this.getAction(command)
      if (!action) {
        return
      }

      this.interpret(action)
    });
  }

  interpret = (action: Action): Exclude<any, typeof unhandled> => {
    this.logAction(action)
    switch (action.type) {
      case 'composite-action':
        action.actions.forEach(this.interpret)
        return
      case 'promise-action':
        action.promise.then(action => this.interpret(action))
        return
      case 'from-state-action':
        this.interpret(action.getAction(this.getState(action.guild)))
        return
      case 'new-state':
        this.guildStates.set(action.newState.context.guild, action.newState)
        return
      case 'send-message':
        const embedColor = '#A4218A'
        const content = action.message.content
        if (content instanceof Discord.MessageEmbed) {
          content.setColor(embedColor)
        } else if (typeof content !== "string") {
          content.embed.setColor(embedColor)
        }
        action.destination.send(content)
          .then(msg => {
            const {guild} = msg
            if (guild) {
              action.message.onSent?.(msg, () => this.getState(guild))
            }
          })
        return
      case 'add-user-to-role':
        action.member.roles.add(action.role)
        return
      case 'remove-user-from-role':
        action.member.roles.remove(action.role)
        return
      case 'save-round':
        db.saveRound(action.round)
        return
      case 'null-action':
        return
      default:
        return unhandled
    }
  }

  logAction = (action: Action) => {
    const event = `action:${action.type}`
    if (action.type === 'new-state') {
      const {newState} = action
      log(event, logGuild(newState.context.guild), { state: getName(newState) }, logState(newState))
    } else if (action.type === 'send-message') {
      const {message, destination} = action
      log(event, logSource(destination), { message: getName(message) }, logMessage(message))
    } else if (action.type === 'save-round') {
      log(event, logChannel(action.round.channel), { round: action.round.id })
    }
  }

  logCommand = (input: Command | ScopedCommand) => {
    const command = input instanceof ScopedCommand ? input.command : input
    const guild = input instanceof ScopedCommand ? logGuild(input.guild) : undefined
    const event = `command:${command.type}`
    switch (command.type) {
      case Begin.type:
        log(event, guild, logUser(command.user))
        break;

      case GetScores.type:
        log(event, guild, { unit: command.unit }, logSource(command.source))
        break;

      case 'help':
        log(event, guild, logSource(command.source))
        break;

      case In.type:
      case Out.type:
      case Notify.type:
      case Unnotify.type:
        log(event, guild, logMember(command.member))
        break;

      case Skip.type:
        log(event, guild)
        break;

      case Submit.type:
        log(event, guild, logUser(command.user), { submission: command.submission })
        break;

      case Vote.type:
        log(event, guild, logUser(command.user), { entry: command.entry })
        break;
    
      default:
        break;
    }
  }
}

const unhandled = Symbol()
