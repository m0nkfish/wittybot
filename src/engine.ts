import * as Discord from 'discord.js';
import * as O from 'rxjs'
import { filter, map, mergeMap } from 'rxjs/operators';

import { GlobalContext } from './context'
import { isNonNull } from './util';
import { log, loggableError } from './log'
import { GlobalCommandFactory, ScopedGlobalCommandFactory, ScopedGlobalCommandHandler, GlobalCommandHandler } from './commands'
import { GuildStates } from './guilds';
import { AllGlobalCommandFactories, AllScopedCommandFactories, LoggedCommandFactory } from './command-factories';
import { AllGlobalCommandHandlers, AllScopedCommandHandlers, LoggedCommandHandler } from './command-handlers';
import { ActionExecutor } from './action-executor';

export class Engine {
  guilds: GuildStates
  commandProcessor: GlobalCommandFactory
  commandHandler: GlobalCommandHandler
  executor: ActionExecutor

  constructor(readonly context: GlobalContext) {
    this.guilds = new GuildStates(context)
    this.commandProcessor = LoggedCommandFactory(AllGlobalCommandFactories().combine(new ScopedGlobalCommandFactory(this.guilds, AllScopedCommandFactories())))
    this.commandHandler = LoggedCommandHandler(AllGlobalCommandHandlers().combine(new ScopedGlobalCommandHandler(this.guilds, AllScopedCommandHandlers())))
    this.executor = new ActionExecutor(this.guilds)
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
        a => this.executor.execute(a),
        err => {
          log.error('error:unhandled', loggableError(err))
          this.run()
        }
      )
  }

}
