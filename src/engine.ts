import * as Discord from 'discord.js';
import * as O from 'rxjs'
import { filter, map, mergeMap } from 'rxjs/operators';

import { saveRound } from './witty/db'
import { GlobalContext } from './context'
import { Action, CompositeAction, FromStateAction, NewState, PromiseAction, Send, AddUserToRole, RemoveUserFromRole, SaveRound, NullAction } from './actions';
import { logAction, logCommand } from './engine-log';
import { isNonNull } from './util';
import { log, loggableError } from './log'
import { Command, GlobalCommandFactory, ScopedGlobalCommandFactory, ScopedGlobalCommandHandler, GlobalCommandHandler } from './commands'
import { GuildStates } from './guilds';
import { AllGlobalCommandFactories, AllScopedCommandFactories } from './command-factories';
import { AllGlobalCommandHandlers, AllScopedCommandHandlers } from './command-handlers';

export class Engine {
  guilds: GuildStates
  commandProcessor: GlobalCommandFactory
  commandHandler: GlobalCommandHandler

  constructor(readonly context: GlobalContext) {
    this.guilds = new GuildStates(context)
    this.commandProcessor = AllGlobalCommandFactories().combine(new ScopedGlobalCommandFactory(this.guilds, AllScopedCommandFactories()))
    this.commandHandler = AllGlobalCommandHandlers().combine(new ScopedGlobalCommandHandler(this.guilds, AllScopedCommandHandlers()))
  }

  getCommand(message: Discord.Message): Command | undefined {
    try {
      return this.commandProcessor.process(message)
    } catch (err) {
      log.error('error:get_command', loggableError(err))
    }
  }

  async getAction(command: Command): Promise<Action | undefined> {
    try {
      logCommand(command)
      return this.commandHandler.handle(command)
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
        this.interpret(action.getAction(this.guilds.getState(action.guild)))
        return

      case NewState.type:
        this.guilds.setState(action.newState.context.guild, action.newState)
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
              action.message.onSent?.(msg, () => this.guilds.getState(guild))
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
        saveRound(action.round)
        return

      case NullAction.type:
        return
    }
  }

}
