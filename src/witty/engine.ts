import { GlobalContext, GuildContext } from '../context'
import { IdleState, AnyGameState } from '../state';
import { Action, CompositeAction, FromStateAction, NewState, PromiseAction, Send, AddUserToRole, RemoveUserFromRole, SaveRound, NullAction } from './actions';
import * as Discord from 'discord.js';
import { HelpMessage } from '../messages';
import * as db from './db'
import { Command, AllWittyCommands, Help } from './commands';
import { AllCommandHandlers } from './command-handlers';
import { logAction, logCommand } from './log';
import * as O from 'rxjs'
import { filter, map, mergeMap } from 'rxjs/operators';
import { isNonNull } from '../util';
import { log, loggableError } from '../log'

export class ScopedCommand {
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
    try {
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
    } catch (err) {
      log.error('error:get_command', loggableError(err))
    }
  }

  async getAction(command: Command | ScopedCommand): Promise<Action | undefined> {
    try {
      logCommand(command)

      if (command instanceof ScopedCommand) {
        return AllCommandHandlers.handle(this.getState(command.guild), command.command)
      }

      if (command.type === 'help') {
        return Send(command.source, new HelpMessage())
      }
    } catch (err) {
      log.error('error:get_action', loggableError(err))
    }
  }

  run() {
    log('run')
    O.fromEvent<Discord.Message>(this.context.client, 'message')
      .pipe(
        filter(m => !m.author.bot),
        map(m => this.getCommand(m)),
        filter(isNonNull),
        mergeMap(c => this.getAction(c)),
        filter(isNonNull)
      ).subscribe(
        a => this.interpret(a),
        err => {
          log.error('error:unhandled', loggableError(err))
          this.run()
        }
      )
  }

  interpret = (action: Action) => {
    logAction(action)
    switch (action.type) {
      case CompositeAction.type:
        action.actions.forEach(this.interpret)
        return

      case PromiseAction.type:
        action.promise.then(action => this.interpret(action))
        return

      case FromStateAction.type:
        this.interpret(action.getAction(this.getState(action.guild)))
        return

      case NewState.type:
        this.guildStates.set(action.newState.context.guild, action.newState)
        return

      case Send.type:
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

      case AddUserToRole.type:
        action.member.roles.add(action.role)
        return

      case RemoveUserFromRole.type:
        action.member.roles.remove(action.role)
        return

      case SaveRound.type:
        db.saveRound(action.round)
        return

      case NullAction.type:
        return
    }
  }

}
