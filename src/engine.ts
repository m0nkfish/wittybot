import * as O from 'rxjs';
import { Observable } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { ActionExecutor } from './action-executor';
import { Action } from './actions';
import { AllGlobalCommandFactories, AllScopedCommandFactories, LoggedCommandFactory } from './command-factories';
import { AllGlobalCommandHandlers, AllScopedCommandHandlers, LoggedCommandHandler } from './command-handlers';
import { ScopedGlobalCommandFactory, ScopedGlobalCommandHandler } from './commands';
import { GlobalContext } from './context';
import { DiscordIO } from './DiscordIO';
import { GuildStates } from './GuildStates';
import { log, loggableError } from './log';
import { isNonNull } from './util';


export class Engine {
  readonly guilds: GuildStates
  readonly executor: ActionExecutor

  private readonly actionStream: Observable<Action>

  constructor(readonly context: GlobalContext) {
    this.guilds = new GuildStates(context)

    const commandProcessor = LoggedCommandFactory(AllGlobalCommandFactories().combine(new ScopedGlobalCommandFactory(this.guilds, AllScopedCommandFactories())))
    const commandHandler = LoggedCommandHandler(AllGlobalCommandHandlers().orElse(new ScopedGlobalCommandHandler(this.guilds, AllScopedCommandHandlers())))
    const io = new DiscordIO(this.guilds, this.context.client)

    this.executor = new ActionExecutor(this.guilds, io)

    const commandStream = O.merge(
      io.eventStream
        .pipe(
          map(m => commandProcessor.process(m)),
          filter(isNonNull)),
      this.executor.commandStream)

    this.actionStream = commandStream
      .pipe(
        mergeMap(c => commandHandler.handle(c)),
        filter(isNonNull))
  }

  run() {
    log('run')
    this.actionStream.subscribe(
      a => this.executor.execute(a),
      err => {
        log.error('error:run-unhandled', loggableError(err))
        this.run()
      })
  }

}
