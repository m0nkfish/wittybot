import * as Discord from 'discord.js';
import * as O from 'rxjs'
import { filter, map, mergeMap, merge } from 'rxjs/operators';

import { GlobalContext } from './context'
import { isNonNull } from './util';
import { log, loggableError } from './log'
import { GlobalCommandFactory, ScopedGlobalCommandFactory, ScopedGlobalCommandHandler, GlobalCommandHandler, Command } from './commands'
import { GuildStates } from './guilds';
import { AllGlobalCommandFactories, AllScopedCommandFactories, LoggedCommandFactory } from './command-factories';
import { AllGlobalCommandHandlers, AllScopedCommandHandlers, LoggedCommandHandler } from './command-handlers';
import { ActionExecutor } from './action-executor';
import { Observable } from 'rxjs';
import { Action } from './actions';

export class Engine {
  guilds: GuildStates
  commandProcessor: GlobalCommandFactory
  commandHandler: GlobalCommandHandler
  executor: ActionExecutor

  commandStream: Observable<Command>
  actionStream: Observable<Action>

  constructor(readonly context: GlobalContext) {
    this.guilds = new GuildStates(context)
    this.commandProcessor = LoggedCommandFactory(AllGlobalCommandFactories().combine(new ScopedGlobalCommandFactory(this.guilds, AllScopedCommandFactories())))
    this.commandHandler = LoggedCommandHandler(AllGlobalCommandHandlers().combine(new ScopedGlobalCommandHandler(this.guilds, AllScopedCommandHandlers())))
    this.executor = new ActionExecutor(this.guilds)

    this.commandStream = O.merge(
      O.fromEvent<Discord.Message>(this.context.client, 'message')
        .pipe(
          filter(m => !m.author.bot),
          map(m => this.commandProcessor.process(m)),
          filter(isNonNull)),
      this.executor.commandStream)

    this.actionStream = this.commandStream
      .pipe(
        mergeMap(c => this.commandHandler.handle(c)),
        filter(isNonNull))
  }

  run() {
    log('run')
    this.actionStream.subscribe(
      a => this.executor.execute(a),
      err => {
        log.error('error:unhandled', loggableError(err))
        this.run()
      })
  }

}
