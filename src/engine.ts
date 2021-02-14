import * as Discord from 'discord.js';
import * as O from 'rxjs'
import { filter, map, mergeMap } from 'rxjs/operators';

import { saveRound } from './witty/db'
import { GlobalContext } from './context'
import { Action, CompositeAction, FromStateAction, NewState, PromiseAction, Send, AddUserToRole, RemoveUserFromRole, SaveRound, NullAction } from './actions';
import { logAction } from './engine-log';
import { isNonNull } from './util';
import { log, loggableError } from './log'
import { GlobalCommandFactory, ScopedGlobalCommandFactory, ScopedGlobalCommandHandler, GlobalCommandHandler } from './commands'
import { GuildStates } from './guilds';
import { AllGlobalCommandFactories, AllScopedCommandFactories, LoggedCommandFactory } from './command-factories';
import { AllGlobalCommandHandlers, AllScopedCommandHandlers, LoggedCommandHandler } from './command-handlers';

export class Engine {
  guilds: GuildStates
  commandProcessor: GlobalCommandFactory
  commandHandler: GlobalCommandHandler

  constructor(readonly context: GlobalContext) {
    this.guilds = new GuildStates(context)
    this.commandProcessor = LoggedCommandFactory(AllGlobalCommandFactories().combine(new ScopedGlobalCommandFactory(this.guilds, AllScopedCommandFactories())))
    this.commandHandler = LoggedCommandHandler(AllGlobalCommandHandlers().combine(new ScopedGlobalCommandHandler(this.guilds, AllScopedCommandHandlers())))
  }

  run() {
    log('run')
    O.fromEvent<Discord.Message>(this.context.client, 'message')
      .pipe(
        filter(m => !m.author.bot),
        map(m => this.commandProcessor.process(m)),
        filter(isNonNull),
        mergeMap(c => this.commandHandler.handle(c)),
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
